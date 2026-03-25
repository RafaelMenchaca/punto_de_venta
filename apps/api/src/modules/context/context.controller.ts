import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { ContextService } from './context.service';
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
}
