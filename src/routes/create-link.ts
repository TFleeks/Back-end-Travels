import { dayjs } from '../lib/dayjs';
import 'dayjs/locale/pt-br';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ClientError } from '../errors/client-error';

dayjs.locale('pt-br')
dayjs.extend(localizedFormat);

export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/create-link/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                url: z.string().url(),
            })
        }
    },async (request) => {
        const { tripId } = request.params
        const { title, url } = request.body

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { 
                activities:  {
                    orderBy: {
                        accurs_at: 'asc'
                    }
                }
            },
        })
        
        if (!trip) {
            throw new ClientError('Trip not found')
        }
        
        const link = await prisma.link.create({
            data: {
                title,
                url,
                trip_Id: tripId,
            }
        })
        
        return { linkId: link.id }
    })
}