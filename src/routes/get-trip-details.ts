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

export async function getTripDetails(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId', {
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
            select: {
                id: true,
                destination: true,
                start_at: true,
                ends_at: true,
                is_confirmed: true,
            },
            where: { id: tripId },
        })
        
        if (!trip) {
            throw new ClientError('Trip not found')
        }
        return { trip }
    })
}