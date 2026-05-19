import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { AssignPackageDto } from './dto/assign-package.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PackagesService } from './packages.service';

@Controller()
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService
  ) {}

  @Get('packages')
  getPackages() {
    return this.packagesService.getPackages();
  }

  @Post('clients/:id/packages')
  assignPackage(
    @Param('id') clientId: string,
    @Body() dto: AssignPackageDto
  ) {
    return this.packagesService.assignPackage(
      clientId,
      dto.packageId
    );
  }

  @Patch('client-packages/:id/payment')
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto
  ) {
    return this.packagesService.updatePayment(
      id,
      dto.paymentStatus as PaymentStatus
    );
  }
}