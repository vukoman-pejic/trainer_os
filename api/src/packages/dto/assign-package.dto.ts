import { IsUUID } from 'class-validator';

export class AssignPackageDto {
  @IsUUID()
  packageId!: string;
}