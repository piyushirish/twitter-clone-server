import { extendSchemaImpl } from "graphql/utilities/extendSchema";

import JWT from 'jsonwebtoken';
import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";

const JWT_SECRET = "Iya$1393131";

class JWTService {
    public static generateTokenForUser(user: User){
        const payload: JWTUser  = {
             id: user?.id,
             email: user?.email, 
        };
        return JWT.sign(payload,JWT_SECRET);

        const token = JWT.sign(payload, JWT_SECRET);
    }

    public static decodeToken(token: string) {
        try {
            return JWT.verify(token, JWT_SECRET) as JWTUser;
        } catch (error){
            return null;
        }
        
    }
}



export default JWTService;