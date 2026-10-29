import mongoose from 'mongoose';
const variant = new mongoose.Schema({
  name:String,sku:{type:String,required:true,unique:true,sparse:true},
  attributes:{type:Map,of:String},price:{type:Number,min:0},compareAtPrice:Number,
  stock:{type:Number,min:0,default:0},image:String
});
const schema = new mongoose.Schema({
  name:{type:String,required:true,index:true},slug:{type:String,required:true,unique:true,index:true},
  brand:{type:mongoose.Schema.Types.ObjectId,ref:'Brand'},category:{type:mongoose.Schema.Types.ObjectId,ref:'Category'},
  shortDescription:String,description:String,images:[String],basePrice:{type:Number,min:0},
  sku:{type:String,required:true,unique:true},variants:[variant],
  stock:{type:Number,min:0,default:0},
  specifications:{type:Map,of:String},warranty:String,tags:[String],
  rating:{type:Number,default:0},reviewCount:{type:Number,default:0},
  featured:{type:Boolean,default:false},isActive:{type:Boolean,default:true}
},{timestamps:true});
schema.index({name:'text',description:'text',tags:'text',sku:'text'});
schema.index({isActive:1,stock:1,_id:1});
schema.index({updatedAt:-1,_id:-1});
schema.index({isActive:1,featured:-1,createdAt:-1,_id:-1});
schema.index({isActive:1,category:1,featured:-1,createdAt:-1,_id:-1});
schema.index({isActive:1,brand:1,featured:-1,createdAt:-1,_id:-1});
export default mongoose.model('Product',schema);
