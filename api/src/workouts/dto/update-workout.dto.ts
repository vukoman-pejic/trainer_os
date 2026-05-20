import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { WorkoutType } from '@prisma/client';

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsString()
  content?: string;
}