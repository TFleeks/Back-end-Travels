import { dayjs } from '../lib/dayjs';
import 'dayjs/locale/pt-br';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { link } from 'fs';
import { ClientError } from '../errors/client-error';

dayjs.locale('pt-br')
dayjs.extend(localizedFormat);

export async function getLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/links', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                accurs_at: z.coerce.date(),
            })
        }
    },async (request) => {
        const { tripId } = request.params
        const { title, accurs_at } = request.body

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { 
                link: true, 
            },
        })
        
        if (!trip) {
            throw new ClientError('Trip not found')
        }

        if (dayjs(accurs_at).isBefore(trip.start_at)) {
            throw new ClientError('Invalid activity date')
        }

        if (dayjs(accurs_at).isAfter(trip.ends_at)) {
            throw new ClientError('Invalid activity date')
        }
        
        const activity = await prisma.activity.create({
            data: {
                title,
                accurs_at,
                trip_Id: tripId,
            }
        })

        return { link: trip.link }
    })
}