
"use server"

import { z } from "zod";

const recaptchaSchema = z.object({
    token: z.string(),
});

export async function verifyRecaptcha(token: string) {
    const validatedFields = recaptchaSchema.safeParse({
        token
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Invalid reCAPTCHA token",
        }
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=6Ld7kNArAAAAANxzpzJaH5AJcdjfjriTjd4xYtll&response=${validatedFields.data.token}`,
    });

    const data = await response.json();

    if (data.success) {
        return {
            success: true,
            message: "reCAPTCHA verified successfully",
        };
    } else {
        return {
            success: false,
            message: "reCAPTCHA verification failed",
        };
    }
}
