import { Model, Schema, model as createModel } from "mongoose";
import { IAccount } from "../../../tools/budget.js";
import { ObjectId } from "mongodb";
// Create a Schema correspondoing to the document interface
const accountSchema = new Schema<IAccount>({
  account_num: { type: Number, required: true, unique: true },
  type: { type: String, default: "" },
  date_opened: { type: Date, default: null },
  date_closed: { type: Date, default: null },
  starting_amount: { type: Number, default: 0 },
  current_amount: { type: Number, default: 0 },
  bucket: { type: [ObjectId], default: [] },
});

const AccountModel: Model<IAccount> = createModel<IAccount>(
  "Account",
  accountSchema
);
export default AccountModel;
