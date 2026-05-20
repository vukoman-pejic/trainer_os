import {
  IsOptional,
  IsUUID,
} from 'class-validator';

export class AssignWorkoutDto {
  @IsOptional()
  @IsUUID()
  workoutTemplateId?: string | null;
}