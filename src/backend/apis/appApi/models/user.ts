import {Model, Schema, model as createModel} from "mongoose"
import  {IUser} from "../../../shared/interfaces/budget.js";

const userSchema = new Schema<IUser>({
    name: {type:String, required:true},
    total: {type:Number, default:0},
    accounts: {type: [Number], required:true}
})
//? Research TypeScript Generics and Extending Mongoose Document Interfaces
//? Why do we have to extend Document why does __v mean?
const UserModel: Model<IUser> = createModel<IUser>("User", userSchema, "user"); 
export default UserModel;
