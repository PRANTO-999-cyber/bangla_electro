import mongoose from 'mongoose';
const address = new mongoose.Schema({
  label:String,name:String,phone:String,addressLine1:String,addressLine2:String,
  city:String,state:String,postalCode:String,country:{type:String,default:'Bangladesh'},isDefault:Boolean
});
const schema = new mongoose.Schema({
  name:{type:String,required:true},email:{type:String,required:true,unique:true,index:true},
  phone:String,password:{type:String,required:true,select:false},
  role:{type:String,enum:['customer','admin'],default:'customer',index:true},
  avatar:String,addresses:[address],isVerified:{type:Boolean,default:false},
  isActive:{type:Boolean,default:true},lastLoginAt:Date,tokenVersion:{type:Number,default:0}
},{timestamps:true});
schema.index({role:1,createdAt:-1,_id:-1});
schema.index({name:'text',email:'text'});
export default mongoose.model('User',schema);
