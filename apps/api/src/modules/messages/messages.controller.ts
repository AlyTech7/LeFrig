import { Body, Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesEventsService } from './messages-events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private messagesEvents: MessagesEventsService,
  ) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: { sub: string }) {
    return this.messagesService.getConversations(user.sub);
  }

  @Get('conversations/:id/stream')
  @Sse()
  async streamMessages(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ): Promise<Observable<MessageEvent>> {
    await this.messagesService.assertParticipant(id, user.sub);
    return this.messagesEvents.createStream(id);
  }

  @Get('conversations/:id')
  getMessages(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.messagesService.getMessages(id, user.sub);
  }

  @Post()
  sendMessage(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { conversationId?: string; recipientId?: string; content: string; type?: string; refId?: string },
  ) {
    return this.messagesService.sendMessage(user.sub, body);
  }
}
