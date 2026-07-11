import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { SearchIndexService } from '../../search/search-index.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private searchIndex: SearchIndexService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: { sub: string }, @Req() req: Request) {
    this.adminService.logAccess(user.sub, 'view_dashboard', 'dashboard', req.ip);
    return this.adminService.getDashboard();
  }

  @Get('overview')
  getOverview(@CurrentUser() user: { sub: string }, @Req() req: Request) {
    this.adminService.logAccess(user.sub, 'view_overview', 'overview', req.ip);
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers(@Query() query: Record<string, string>) {
    return this.adminService.listUsers(query);
  }

  @Get('listings')
  listListings(@Query() query: Record<string, string>) {
    return this.adminService.listListings(query);
  }

  @Patch('listings/:id/status')
  updateListingStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateListingStatus(id, status);
  }

  @Get('orders')
  listOrders(@Query() query: Record<string, string>) {
    return this.adminService.listOrders(query);
  }

  @Get('disputes')
  listDisputes(@Query() query: Record<string, string>) {
    return this.adminService.listDisputes(query);
  }

  @Get('shops')
  listShops(@Query() query: Record<string, string>) {
    return this.adminService.listShops(query);
  }

  @Get('transport')
  listTransport(@Query() query: Record<string, string>) {
    return this.adminService.listTransport(query);
  }

  @Patch('transport/:id/assign')
  assignTransport(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.adminService.assignTransport(id, driverId);
  }

  @Get('camps')
  listCamps() {
    return this.adminService.listCamps();
  }

  @Get('access-logs')
  getAccessLogs() {
    return this.adminService.getAccessLogs();
  }

  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: string, @Body('level') level: string) {
    return this.adminService.verifyUser(id, level);
  }

  @Patch('users/:id/ban')
  setUserBan(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { banned: boolean; reason?: string; suspendedUntil?: string },
    @Req() req: Request,
  ) {
    this.adminService.logAccess(user.sub, body.banned ? 'ban_user' : 'unban_user', `user:${id}`, req.ip);
    return this.adminService.setUserBan(id, user.sub, body);
  }

  @Get('drivers')
  listDrivers(@Query() query: Record<string, string>) {
    return this.adminService.listDrivers(query);
  }

  @Patch('drivers/:userId/verify')
  verifyDriver(@Param('userId') userId: string, @Body('verified') verified: boolean) {
    return this.adminService.verifyDriver(userId, verified);
  }

  @Post('search/reindex')
  reindexSearch(@CurrentUser() user: { sub: string }, @Req() req: Request) {
    this.adminService.logAccess(user.sub, 'reindex_search', 'meilisearch', req.ip);
    return this.searchIndex.reindexListings();
  }

  @Get('jobs')
  listJobs(@Query() query: Record<string, string>) {
    return this.adminService.listJobs(query);
  }

  @Patch('jobs/:id/active')
  toggleJob(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.adminService.toggleJobActive(id, isActive);
  }

  @Get('needs')
  listNeeds(@Query() query: Record<string, string>) {
    return this.adminService.listNeeds(query);
  }

  @Patch('needs/:id/status')
  updateNeedStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateNeedStatus(id, status);
  }

  @Get('community')
  listCommunity(@Query() query: Record<string, string>) {
    return this.adminService.listCommunityPosts(query);
  }

  @Patch('community/:id/pin')
  pinCommunity(@Param('id') id: string, @Body('isPinned') isPinned: boolean) {
    return this.adminService.toggleCommunityPin(id, isPinned);
  }

  @Post('community/:id/delete')
  deleteCommunity(@Param('id') id: string) {
    return this.adminService.deleteCommunityPost(id);
  }

  @Get('diaspora/orders')
  listDiasporaOrders(@Query() query: Record<string, string>) {
    return this.adminService.listDiasporaOrders(query);
  }

  @Patch('diaspora/orders/:id/status')
  updateDiasporaOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateDiasporaOrderStatus(id, status);
  }

  @Get('vouchers')
  listVouchers(@Query() query: Record<string, string>) {
    return this.adminService.listVouchers(query);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.adminService.resolveDispute(id, resolution || 'Resuelto por administración');
  }

  @Get('cash/agreements')
  listCashAgreements(@Query() query: Record<string, string>) {
    return this.adminService.listCashAgreements(query);
  }

  @Post('actions/log')
  logAction(
    @CurrentUser() user: { sub: string },
    @Body() body: { action: string; resource?: string },
    @Req() req: Request,
  ) {
    return this.adminService.logAccess(user.sub, body.action, body.resource, req.ip);
  }
}
