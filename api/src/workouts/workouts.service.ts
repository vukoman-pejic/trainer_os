import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(
    trainerId: string,
    dto: CreateWorkoutDto
  ) {
    return this.prisma.workoutTemplate.create({
      data: {
        trainerId,
        name: dto.name,
        type: dto.type,
        content: dto.content,
      },
    });
  }

  async findAll(trainerId: string) {
    return this.prisma.workoutTemplate.findMany({
      where: {
        trainerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    trainerId: string,
    workoutId: string,
    dto: UpdateWorkoutDto
  ) {
    const workout =
      await this.prisma.workoutTemplate.findFirst({
        where: {
          id: workoutId,
          trainerId,
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found'
      );
    }

    return this.prisma.workoutTemplate.update({
      where: {
        id: workoutId,
      },
      data: dto,
    });
  }

  async remove(
    trainerId: string,
    workoutId: string
  ) {
    const workout =
      await this.prisma.workoutTemplate.findFirst({
        where: {
          id: workoutId,
          trainerId,
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found'
      );
    }

    return this.prisma.workoutTemplate.delete({
      where: {
        id: workoutId,
      },
    });
  }
}