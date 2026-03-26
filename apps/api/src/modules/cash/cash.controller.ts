import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CashService } from './cash.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { GetOpenCashSessionDto } from './dto/get-open-cash-session.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('registers/:registerId/open-session')
  getOpenCashSessionByRegister(
    @Param('registerId', new ParseUUIDPipe()) registerId: string,
    @Query() query: GetOpenCashSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cashService.getOpenCashSessionByRegister(
      registerId,
      query,
      user,
    );
  }

  @Post('sessions/open')
  openCashSession(
    @Body() body: OpenCashSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cashService.openCashSession(body, user);
  }

  @Get('sessions/:cashSessionId/summary')
  getCashSessionSummary(
    @Param('cashSessionId', new ParseUUIDPipe()) cashSessionId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cashService.getCashSessionSummary(cashSessionId, user);
  }

  @Post('sessions/:cashSessionId/movements')
  createCashMovement(
    @Param('cashSessionId', new ParseUUIDPipe()) cashSessionId: string,
    @Body() body: CreateCashMovementDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cashService.createCashMovement(cashSessionId, body, user);
  }

  @Post('sessions/close')
  closeCashSession(
    @Body() body: CloseCashSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cashService.closeCashSession(body, user);
  }
}
