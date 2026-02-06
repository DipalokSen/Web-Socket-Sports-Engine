import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import {db} from "../db/db.js"
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

matchesRouter.get("/", async (req, res) => {

  // res.status(200).json({ message: "Matches List!" });

  const parse=listMatchesQuerySchema.safeParse(req.query);

  if(!parse.success){
    return res.status(400).json({ error: parse.error.errors });
  }

  const limit=Math.min(parse.data.limit?? 50,100)

  try{
      const data=await db.select()
      .from(matches)
      .orderBy(desc(matches.startTime))
      .limit(limit)

      res.json({ data });
  }


  catch(error){
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }

})


matchesRouter.post("/", async (req, res) => {

 const parsed=createMatchSchema.safeParse(req.body);
 const {data:{startTime,endTime,homeScore,awayScore}}=parsed;

 if(!parsed.success){
    return res.status(400).json({ error: parsed.error.errors });
 }

 try{
   const [event]=await db.insert(matches).values({
    ...parsed.data,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    homeScore: homeScore || 0,
    awayScore: awayScore || 0,
    status:getMatchStatus(startTime,endTime)

    

   }).returning();


   res.status(201).json({ message: "Match created successfully!", data: event });
 }
 catch(error){
    
    return res.status(500).json({ error: error.message || "Internal Server Error" });
 }



})
