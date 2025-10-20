'use server';

import nodemailer from "nodemailer";

interface SendEmailOptions{
    emailTemplate:string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});


export const sendEmail = async(to:string,options?:SendEmailOptions)=>{
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "XXXXXXXXXXXXXXXXXXXXXX",
            subject: "Hello ✔",
            html: "<b>Hello world?</b>",
          });
          console.log("Message sent: %s", info.messageId);
          return {
            success:true,
            message:"Email Sent Successfully",
            data:info
          }
    } catch (error:any) {
         return {
            success:false,
            message:error.message,
            data:null
          }
    }
}