import { IAccount } from "../shared/interfaces/budget.js";
import express, { Request, Response, Router } from "express";
import dotenv from 'dotenv'
import BucketModel from "../apis/appApi/models/transactions.js";
import {
  account_seed,
  account_seed_full,
  accounts_seed,
  accounts_seed_full,
  transaction_seed,
} from "./seed.js";
import AccountModel from "../apis/appApi/models/account.js";
import UserModel from "../apis/appApi/models/user.js";

dotenv.config();

export namespace BudgetApp {
  export const router: Router = express.Router();
  //Todo: Add valiadation to make sure the resquest has admin privliges to seed data
  router.patch("/seed/accounts", async (req: Request, res: Response) => {
  //Todo: We can use req.body to check a different user
    const data = account_seed_full;
    try {
      const ids = await UnpackAccountIds(data, ValidateAccount(data));
      const result = await UserModel.findOneAndUpdate(
        {accounts:{$exists: true, $type: "array"}, name: "John Doe"},
        {$push: { 'accounts': ids }},
        {new: true}
      ).exec();
      res.status(200).send(result);
    } catch (error) {
      res.status(500).send(error);
    }
  });


//   router.post(
//     "/seed/transactions/:accountId",
//     async (req: Request, res: Response) => {
//       try {
//         const result = await BucketModel.findOneAndUpdate(
//           { account_num: req.params.accountId },
//           { $push: { transactions: transaction_seed } },
//           { new: true }
//         );
//         if (!result)
//           throw new Error(
//             `There is no account with the value of ${req.params.accountId}`
//           );

//         res.status(200).send(result);
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   );

  type AccountParams = number | number[] | IAccount | IAccount[];
  enum ValidationResult {
    SINGLE_NUMBER = 0,
    SINGLE_ACCOUNT_WITH_DATA = 1,
    ARRAY_NUMBERS = 2,
    ARRAY_ACCOUNTS_WITH_DATA = 3,
  }

  //! Here we are sending account numbers for the user to hold while also inserting data into the account collection
  export async function UnpackAccountIds(params: AccountParams, code: ValidationResult){
    //number|number[]
    let account:AccountParams;
    switch (code) {
      case 0: //Single Number
        account = CreateAccount({account_num:params} as IAccount);
        await CreateAccounts(`http://localhost:${process.env.PORT}/api/accounts`,account);
        return params as number;
      case 1:
        account = CreateAccount(params as IAccount);
        account.current_amount = account.starting_amount;
        await CreateAccounts(`http://localhost:${process.env.PORT}/api/accounts`,account);
        return (params as IAccount).account_num;
      case 2:
        const accounts = (params as number[]).map(id => ({account_num: id} as IAccount));
        account = accounts.map(account => CreateAccount(account))
        await CreateAccounts(`http://localhost:${process.env.PORT}/api/accounts`,account);
        return params as number[];
      case 3:
        account = []; 
        const ids = (params as IAccount[]).map(
          (element) => 
          {
            element.current_amount = element.starting_amount;
            (account as IAccount[]).push(CreateAccount(element));
            return element.account_num
          }
        );
        await CreateAccounts(`http://localhost:${process.env.PORT}/api/accounts`, account as IAccount[]);
        return ids;
    }
  }


  export function ValidateAccount(param: AccountParams): ValidationResult {
    let message = "Created an";
    if (Array.isArray(param)) {
      message += " array ";
      let element = param[0];
      if (isFilledAccount(element)) {
        message += "of IAccount objects";
        console.log(message);
        return ValidationResult.ARRAY_ACCOUNTS_WITH_DATA;
      } else {
        message += "of numbers";
        console.log(message);
        return ValidationResult.ARRAY_NUMBERS;
      }
    } else {
      message += " single ";
      if (isFilledAccount(param)) {
        message += "object type IAccounts";
        console.log(message);
        return ValidationResult.SINGLE_ACCOUNT_WITH_DATA;
      } else {
        message += "number";
        console.log(message);
        return ValidationResult.SINGLE_NUMBER;
      }
    }
  }
  //If the o
  function isFilledAccount(a: Number | IAccount): a is IAccount {
    return typeof a === "object" && "account_num" in a; //? Why are we checking "account_num" specifically
  }

  //Take the partial data from the parameter and replace the data in this template object
  function CreateAccount(param:Partial<IAccount>):IAccount{
    const template:IAccount = {
        account_num: null,
        type: null,
        date_opened: new Date(Date.now()),
        date_closed: null,
        starting_amount:null,
        current_amount: null, 
        bucket:null
    }
    return Object.assign(template,param);
  }
  async function CreateAccounts(route:string,data:IAccount|IAccount[]): Promise<void> {
    await fetch(route,
      {
       method:"POST",
       headers: {
         "Content-Type":"application/json",
       },
       body: JSON.stringify(data),
     });
  }

  export async function DeleteAccounts(values:string):Promise<any>{
    let response = await fetch(`http://localhost:${process.env.PORT}/api/accounts?account_nums=${values}`,
      {
        method:"DELETE",
        headers: {
          "Content-Type":"application/json",
        }
      }
    );
    console.log(`b is:${JSON.stringify(response)}`)
    return response;
  }

  //else it is object or array of objects then we can save it to the db

  //     // Promise.all([
  //        let res =  await fetch('/api/accounts/create', {
  //             method:"POST",
  //             headers:{"Content-Type": "application/json"},
  //             body: JSON.stringify(account_var)
  //         }).then(res => res.json())
  //         console.log(res);
  //     // ])

  // }

}
