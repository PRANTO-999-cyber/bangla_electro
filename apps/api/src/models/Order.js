import mongoose from 'mongoose';
const item=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},productName:String,sku:String,image:String,variant:mongoose.Schema.Types.Mixed,quantity:Number,unitPrice:Number,totalPrice:Number},{_id:false});
const s=new mongoose.Schema({
 orderNumber:{type:String,unique:true,index:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},
 items:[item],shippingAddress:mongoose.Schema.Types.Mixed,subtotal:Number,discount:Number,shippingCost:Number,tax:Number,total:Number,
 coupon:mongoose.Schema.Types.Mixed,paymentMethod:String,paymentStatus:{type:String,default:'pending'},
 orderStatus:{type:String,default:'pending',index:true},tracking:mongoose.Schema.Types.Mixed,
 stockReserved:{type:Boolean,default:false,index:true},stockReservedUntil:Date
},{timestamps:true});
s.index({user:1,createdAt:-1,_id:-1});
s.index({createdAt:-1,_id:-1});
s.index({paymentStatus:1,stockReserved:1,stockReservedUntil:1});
export default mongoose.model('Order',s);
