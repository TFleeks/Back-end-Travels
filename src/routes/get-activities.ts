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

export async function getActivities(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
        },
    },
    async (request) => {
        const { tripId } = request.params
        const trip = await prisma.trip.findUnique({
            where: {id: tripId},
            include: { activities: true },
        })
        
        if (!trip) {
            throw new ClientError('Trip not found')
        }

        return { activityId: trip.activities }
    })
}