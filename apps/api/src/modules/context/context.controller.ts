import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { ContextService } from './context.service';
import { GetContextBranchesDto } from './dto/get-context-branches.dto';
import { GetContextRegistersDto } from './dto/get-context-registers.dto';
import { GetOperatingContextDto } from './dto/get-operating-context.dto';

@Controller('context')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Get('operating')
  getOperatingContext(
    @Query() query: GetOperatingContextDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contextService.getOperatingContext(query, user);
  }

  @Get('businesses')
  getBusinesses(@CurrentUser() user: RequestUser) {
    return this.contextService.getBusinesses(user);
  }

  @Get('branches')
  getBranches(
    @Query() query: GetContextBranchesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contextService.getBranches(query, user);
  }

  @Get('registers')
  getRegisters(
    @Query() query: GetContextRegistersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contextService.getRegisters(query, user);
  }
}
