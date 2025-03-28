import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SendcloudService } from './sendcloud.service';
import { SendcloudClient } from './sendcloud.client';
import { Logger } from '@vendure/core';
import { loggerCtx } from './constants';
import { IncomingWebhookBody } from './types/sendcloud-api.types';
import { sendcloudStates } from './types/sendcloud.types';

@Controller('sendcloud')
export class SendcloudController {
  constructor(private sendcloudService: SendcloudService) {}

  @Post('webhook/:channelToken')
  async webhook(
    @Req() req: Request,
    @Body() body: IncomingWebhookBody,
    @Headers(SendcloudClient.signatureHeader) signature: string,
    @Param('channelToken') channelToken: string
  ): Promise<unknown> {
    const rawBody = (req as any).rawBody || JSON.stringify(body); // TestEnvironment doesnt have middleware applied, so no rawBody available
    const ctx = await this.sendcloudService.createContext(channelToken);
    const { client } = await this.sendcloudService.getClient(ctx);
    if (!client.isValidWebhook(rawBody, signature)) {
      Logger.warn(
        `Ignoring incoming webhook for channel ${channelToken}, because it has an invalid signature`,
        loggerCtx
      );
      return;
    }
    if (body.action !== 'parcel_status_changed') {
      return Logger.info(
        `Incoming webhook: ${body.action}. skipping...`,
        loggerCtx
      );
    }
    Logger.info(
      `Incoming Sendcloud webhook: ${body.action} - ${body.parcel?.id} - ${body.parcel?.order_number} - ${body.parcel?.status.id} (${body.parcel?.status.message})`,
      loggerCtx
    );
    const status = sendcloudStates.find(
      (s) => s.id === body.parcel?.status?.id
    );
    if (!status) {
      return Logger.warn(
        `Status is ${body.action}, but no matching SendCloud status was found for ${body.parcel?.status}`,
        loggerCtx
      );
    }
    if (!status.orderState) {
      return Logger.info(
        `No corresponding Vendure order state for SendCloud status ${body.parcel?.status}. Ignoring this webhook.`,
        loggerCtx
      );
    }
    if (!body.parcel?.order_number) {
      return Logger.warn(
        `No order_number in incoming Sendcloud webhook: ${JSON.stringify(
          body.parcel
        )}`,
        loggerCtx
      );
    }
    await this.sendcloudService.updateOrderStatus(
      ctx,
      status,
      body.parcel.order_number,
      body.parcel.tracking_number
    );
  }
}
