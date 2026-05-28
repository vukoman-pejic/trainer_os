-- AlterEnum
ALTER TYPE "public"."BookingStatus" ADD VALUE 'PENDING_APPROVAL';

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'LATE_RESCHEDULE_REQUEST';

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "requestedEndAt" TIMESTAMP(3),
ADD COLUMN     "requestedStartAt" TIMESTAMP(3);
