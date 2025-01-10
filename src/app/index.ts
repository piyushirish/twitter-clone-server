import express, { query } from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {User} from './user';
import {Tweet} from './tweet';
import { GraphqlContext, JWTUser } from "../interfaces";
import JWTService from "../servicces/jwt";


export async function initServer() {
    const app = express();

    app.use(bodyParser.json());
    app.use(cors());

    app.get("/", (req, res) => {
        res.status(200).json({ message: "Everything is good" })
    });


    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${User.types}
            ${Tweet.types}

            type Query {
                ${User.queries}
                ${Tweet.queries}
            },
            
            type Mutation {
                ${Tweet.mutations}
                ${User.mutations}
            }
        `,
        resolvers: {
            Query: { 
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries,
            }, 
            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations,
            },
            ...Tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers,
            
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