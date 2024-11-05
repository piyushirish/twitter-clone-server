import express, { query } from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {User} from './user';
import { GraphqlContext, JWTUser } from "../interfaces";
import JWTService from "../servicces/jwt";


export async function initServer() {
    const app = express();

    app.use(bodyParser.json());
    app.use(cors());
    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${User.types}
            type Query {
                ${User.queries}
            },    
        `,
        resolvers: {
            Query: { 
                ...User.resolvers.queries,
            },            
        },
    });

    await graphqlServer.start();
    
    app.use(
        '/graphql',
        expressMiddleware(graphqlServer, {
            context: async ({ req }) => {
                const authHeader = req.headers.authorization || '';
                let user: JWTUser | undefined;

                if (authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split('Bearer ')[1];
                    user = JWTService.decodeToken(token) || undefined; // Convert null to undefined
                }

                return { user };
            },
        })
    );

    return app;
}