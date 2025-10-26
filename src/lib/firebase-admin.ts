'use server';

import { initializeApp, getApps,getApp, cert, App, ServiceAccount} from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";


// import serviceAccountKey from '@/firebase-adminsdk.json';
// const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY):{}

const serviceAccountKey = {
    type:process.env.FIREBASE_SERVICE_ACCOUNT_type??'',
    project_id:process.env.FIREBASE_SERVICE_ACCOUNT_project_id??'',
    private_key_id:process.env.FIREBASE_SERVICE_ACCOUNT_private_key_id??'',
    private_key:process.env.FIREBASE_SERVICE_ACCOUNT_private_key,
    client_email:process.env.FIREBASE_SERVICE_ACCOUNT_client_email??'',
    client_id:process.env.FIREBASE_SERVICE_ACCOUNT_client_id??'',
    auth_uri:process.env.FIREBASE_SERVICE_ACCOUNT_auth_uri??'',
    token_uri:process.env.FIREBASE_SERVICE_ACCOUNT_token_uri??'',
    auth_provider_x509_cert_url:process.env.FIREBASE_SERVICE_ACCOUNT_auth_provider_x509_cert_url??'',
    client_x509_cert_url:process.env.FIREBASE_SERVICE_ACCOUNT_client_x509_cert_url??'',
    universe_domain:process.env.FIREBASE_SERVICE_ACCOUNT_universe_domain??''
}


// console.log(serviceAccountKey);
let adminApp: App;
if (!getApps().length) {
    try {
      adminApp =  initializeApp({
            // credential: admin.credential.cert(serviceAccountKey),
            credential: cert(serviceAccountKey as ServiceAccount),
            // databaseURL: "https://garage-pro-ev-default-rtdb.firebaseio.com"
        });
    } catch (error: any) {
        if (error.code !== 'auth/invalid-credential') {
            console.error('Firebase admin initialization error', error.stack);
        }
    }
}else{
    adminApp = getApp();
}



export const createUserWithEmailAndPasswordByAdmin = async ({ email, password, displayName }: { email: string, password: string, displayName: string }) => {
    try {
        const adminAuth = getAuth();

        if (!adminAuth) {
            throw new Error("Admin auth error");
        }

        const createdUser = await adminAuth.createUser({ email, password, displayName });

        return {
            success: true,
            message: "user created",
            data: createdUser.toJSON()
        }

    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            data: null
        }
    }
}
