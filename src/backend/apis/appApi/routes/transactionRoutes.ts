import express, { Request, Response } from "express";
import { Types } from "mongoose";
import BucketModel from "../models/transactions.js";
import {
  ITransaction,
  ITransaction_Bucket,
} from "../../../shared/interfaces/budget.js";
import { BudgetApp } from "../../../tools/budgetMe.js";

const router: any = express.Router();
/**
 * @param {string} - route endpoint
 * @param {Request}
 * @param {Response}
 * @callback => Finds all transaction buckets that match the given account id or if the query
 * parameters is provided _id=string then we will get a single transaction bucket
 */
//localhost:8080/api/transactions/123?_id=ObjectId&fields=accounts
router.get("/:accountId", async (req: Request, res: Response) => {
  try {
    let id;
    if (!req.query._id) console.log("Selecting all transaction buckets");
    else {
      id = new Types.ObjectId(req.query._id as string);
      console.log("Selecting one transaction bucket that matches an object id");
    }

    //Get the fields query parameter, if provided
    const fields = req.query.fields
      ? (req.query.fields as string).split(",").join(" ")
      : "";

    const query = {
      account_id: req.params.accountId,
      ...(id ? { _id: id } : {}),
    };
    const result = await BucketModel.find(query, fields);

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * @param {string} - route endpoint
 * @param {Request}
 * @param {Response}
 * @callback => Add a transaction to an current transaction bucket or create a new transaction bucket
 */

router.post("/add/:accountId", async (req: Request, res: Response) => {
  try {
    const transaction = BudgetApp.CreateTransaction(req.body.transaction);
    const query = {
      account_id: req.params.accountId,
      start_date: { $lte: transaction.date },
      end_date: { $gte: transaction.date },
    };
    const doc = await BudgetApp.DoesBucketExist(query);
    //Update bucket with the new transaction information
    if (doc) {
      console.log(doc._id);
      const result = await BudgetApp.UpdateBucket(transaction,doc._id, "push");
      res.status(200).send(`The response is okay: ${result}`);
    } else {
      //Create a new document
      const bucket = new BucketModel(BudgetApp.CreateBucket(transaction, parseInt(req.params.accountId)))
      bucket.save();
      //Add the document's object id to accounts array
      BudgetApp.AddReference(req.params.accountId,"bucket", bucket._id);
      res.status(200).send(`The response is okay: ${bucket}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.patch("/push/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await BucketModel.findByIdAndUpdate(id,
      { $push: { transactions: req.body} },
      { new: true }
    ).exec();
    res.status(200).send(result);
  } catch (e) {
    console.error(e);
  }
});

router.patch("/pull/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    console.log(req.body);
    const result: any = await BucketModel.findByIdAndUpdate(
      id,
      { $pull: {transactions:req.body}},
      { new: true }
    ).exec();
    if (!result) throw new Error("This is not the right bucket");
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.delete("/del", async(req:Request, res:Response) => {
  try {
        const objIdArray = (req.query.account_nums as string).split(',').map(ids => new Types.ObjectId(ids))
        const result = BucketModel.deleteMany({_id: {$in: objIdArray}});
        res.status(200).send(result);
  } catch(e) {
    console.error(e);
  }
})

/**
//  * @param startDate
//  * @returns a new date 14 days after the start date
//  */
// function CreateEndDate(startDate: Date): Date {
//   let date = new Date(startDate);
//   date.setDate(date.getDay() + 14);
//   return date;
//}

// /**
//  * @param transaction
//  * @param trans_bucket
//  * @returns a new compiled Bucket model where the first element of the transaction array is the transaction
//  * passed in the request.
//  */
// function CreateModel(
//   transaction?: ITransaction,
//   trans_bucket?: ITransaction_Bucket
// ): any {
//   try {
//     let bucket: ITransaction_Bucket;
//     if (trans_bucket) {
//       //Create the Transaction bucket with a new bucket.
//       bucket = trans_bucket;
//     } else if (transaction) {
//       //Create the transaction bucket with the first transaction
//       let array: ITransaction[] = [transaction];
//       bucket = new BucketModel({
//         account_id: transaction.account,
//         transaction_count: 1,
//         start_date: transaction.date,
//         end_date: CreateEndDate(transaction.date),
//         transactions: array,
//       });
//     } else {
//       throw new Error("Either transaction of trans_bucket must be provided");
//     }
//     return bucket;
//   } catch (error) {
//     console.error(error);
//   }
// }
export default router;

// router.post("/create/bucket", async (req: Request, res:Response) => {
//     const result = CreateModel(undefined, req.body.data);
//     result.save()
//     res.send(`Created a new bucket ${result}`);
// })
