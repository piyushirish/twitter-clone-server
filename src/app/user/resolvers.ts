import axios from 'axios';
import { json } from 'body-parser';
import { prismaClient } from '../../clients/db';
import JWTService from '../../servicces/jwt';
import { GraphqlContext } from '../../interfaces';
import { User } from '@prisma/client';


interface GoogleTokenResult{
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;


}


const queries = {
    verifyGoogleToken: async(parent: any, {token}:{token: String}) => {
        const googleToken = token;
        const googleOauthURl = new URL('https://oauth2.googleapis.com/tokeninfo')
        googleOauthURl.searchParams.set('id_token', String(googleToken) );

        const {data} = await axios.get<GoogleTokenResult>
        (googleOauthURl.toString(),
        {
            responseType: 'json',
        } )

        const user = await prismaClient.user.findUnique({
            where: { email: data.email },
        });

        if(!user) {
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name?? '',
                    lastName: data.family_name,
                    profileImageURL: data.picture,
                    

                },
            });
        }
        const userInDb = await prismaClient.user.findUnique({ where: {email: data.email}})

        if(!userInDb) throw new Error ('user with email not found')
        const usertoken = JWTService.generateTokenForUser(userInDb)

        return usertoken;
    },
    getCurrentUser: async(parent: any, args: any, ctx: GraphqlContext ) => {
        const id = ctx.user?.id;
        if(!id) return null;


        const user = await prismaClient.user.findUnique({ where: {id} });
        return user;
    },
};

const extraResolvers = {
    User: {
        tweets: (parent: User) =>
            prismaClient.tweet.findMany( { where: { author: { id: parent.id } } } ),
    }
}

export const resolvers = {queries, extraResolvers };