import 'dayjs/locale/pt-br';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { dayjs } from '../lib/dayjs';
import { prisma } from '../lib/prisma';
import { ClientError } from '../errors/client-error';

dayjs.locale('pt-br')
dayjs.extend(localizedFormat);

export async function getParticipant(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId', {
        schema: {
            params: z.object({
                participantId: z.string().uuid(),
            }),
        },
    },
    async (request) => {
        const { participantId } = request.params
        const participant = await prisma.participant.findUnique({
            select: {
                id: true,
                name: true,
                email: true,
                is_confirmed: true,
            },
            where: {id: participantId },
        })
        
        if (!participant) {
            throw new ClientError ("Participante not found")
        }

        return { participant }
    }
)}