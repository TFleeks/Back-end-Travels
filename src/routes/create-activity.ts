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

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
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

        const differenceOfDaysBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(trip.start_at, 'days')

        const activities = Array.from({ length: differenceOfDaysBetweenTripStartAndEnd + 1 }).map((_, index) => {
            const date = dayjs(trip.start_at).add(index, 'days')

            return {
                date: date.toDate(),
                activities: trip.activities.filter(activities => {
                    return dayjs(activity.accurs_at).isSame(date, 'day')
                })
            }
        })

        return { activities }
    })
}