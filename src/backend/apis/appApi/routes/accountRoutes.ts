import express, {Request, Response, Router}from "express";
import AccountModel from "../models/account.js";
import { Types } from "mongoose";

const router:Router = express.Router();

/** 
 * @param {string} - / refers to the root
 * @param {Request} 
 * @param {Response} 
 * @callback => will fetch all documents within the accounts collection
*/
router.get("/", async (req:Request, res:Response) => {
    try {
        console.log('Client retrieving account information');
        const number = req.query.id ? req.query.id : null;
        const query = number ? {account_num:number}:{}; 
        //Get the fields query parameter, if provided
        const fields = req.query.fields ? (req.query.fields as string).split(',').join(' ') 
                    : '';
        const result = await AccountModel.find(query,fields);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.post('/', async(req:Request,res:Response) => {
    const data = req.body;
    try {
        let result;
        if(!Array.isArray(data))
        {
            console.log(data);
            console.log("data recieved is not an array");
            result = new AccountModel(data);
            await result.save();
        }
        else
        {
            console.log("data recieved is an array");
            result = await AccountModel.insertMany(data)
        }
        console.log(`Account data inserted successfully`) 
        res.status(200).send(result);
    } catch (e) {
        console.error(e);
    }
});

router.patch('/update-type/:accountId', async(req:Request, res:Response) => {
    const id:string = req.params.accountId;
    console.log(req.body);
    const accountType:string = req.body.type;

    const result = await AccountModel.updateOne({account_num: id},
        {$set: {type:accountType}},
        {new:true}
    );
    console.log(`Updating ${id}'s account type to: ${accountType}`);
    res.status(200).send(result);
});

router.patch('/update-balance/:accountId', async(req:Request, res:Response) => {
    const id:string = req.params.accountId;
    const balance:number = req.body.balance; 

    const result = await AccountModel.updateOne({account_num: id},
        {$set: {current_amount:balance}},
        {new:true}
    ).exec();
    console.log(`Updating  ${id}'s account balance: ${balance}`);
    res.status(200).send(result);
})

router.patch('/update-bucket/:accountId', async(req:Request, res:Response) => {
    const accountId = req.params.accountId;
    const {prop,value} = req.body;
    const id =  new Types.ObjectId(value as string);
    console.log(`$${prop}`);
    
    console.log(accountId);

    const result = await AccountModel.updateOne({account_num: accountId},
        [
            {$set: {[prop] : {$ifNull: [`$${prop}`,[id] ]}}},
        ],
        {new:true} 
    )
    console.log("Added the data")
    res.status(200).send("Updated Accout");
});

router.delete('/', async(req:Request, res:Response) => {
    const accountsArray = (req.query.account_nums as string).split(',').map(account => parseInt(account))
    const result = await AccountModel.deleteMany({account_num: {$in: accountsArray}})
    res.status(200).send(result)
});













//Todo: two patches for adding a transaction bucket obj id and antoher for updating the current balance
//router.patch


// router.patch("/balance/:accountId", async (req: Request, res:Response) => {
//     const account = await AccountModel.findOne({"account_id" : req.params.accountId});
//     const appliedBucket = await BucketModel.find({"account_id" : req.params.accountId});
    
//     res.send({
//         account,
//         appliedBucket
//     });
// }); 

export default router;