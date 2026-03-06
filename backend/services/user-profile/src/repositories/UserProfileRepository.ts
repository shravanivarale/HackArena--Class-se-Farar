// User Profile Repository
// Task 3.1: Database operations for User Profile Service

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
  IncomeBracket,
  KYCStatus,
  NotificationFrequency,
} from '../models/UserProfile';
import { LeagueService } from '../services/LeagueService';
import logger from '../config/logger';

export class UserProfileRepository {
  constructor(private pool: Pool) { }

  /**
   * Task 3.1.1: POST /users endpoint - Create new user profile
   */
  async createUserProfile(
    data: CreateUserProfileDTO
  ): Promise<UserProfile> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const userId = uuidv4();
      const { bracket, leagueId } = LeagueService.assignLeague(
        data.declaredMonthlyIncome
      );

      const query = `
        INSERT INTO user_profiles (
          user_id,
          kyc_status,
          income_bracket,
          declared_monthly_income,
          income_type,
          location_type,
          location_state,
          location_city,
          league_id,
          algorand_address,
          household_config,
          consent_flags,
          notification_preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        userId,
        KYCStatus.PENDING,
        bracket,
        data.declaredMonthlyIncome,
        data.incomeType,
        data.locationType,
        data.locationState,
        data.locationCity,
        leagueId,
        data.algorandAddress,
        JSON.stringify({ sharedExpenses: [] }),
        JSON.stringify({
          escrowEnabled: false,
          squadEnabled: false,
          anonymizedDataSharing: false,
          b2bParticipant: false,
        }),
        JSON.stringify({
          frequency: NotificationFrequency.STANDARD,
          streakAlerts: true,
          challengeAlerts: true,
          forecastAlerts: true,
        }),
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('User profile created', { userId });
      return this.mapRowToUserProfile(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating user profile', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Task 3.1.2: GET /users/{userId} endpoint - Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUserProfile(result.rows[0]);
  }

  /**
   * Task 3.1.3: PATCH /users/{userId} endpoint - Update user profile
   */
  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileDTO
  ): Promise<UserProfile | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.declaredMonthlyIncome !== undefined) {
        updates.push(`declared_monthly_income = $${paramCount}`);
        values.push(data.declaredMonthlyIncome);
        paramCount++;

        // Check if league reassignment is needed
        const currentProfile = await this.getUserProfile(userId);
        if (currentProfile) {
          const needsReassignment = LeagueService.needsReassignment(
            currentProfile.incomeProfile.bracket,
            data.declaredMonthlyIncome
          );

          if (needsReassignment) {
            const { bracket, leagueId } = LeagueService.assignLeague(
              data.declaredMonthlyIncome
            );
            updates.push(`income_bracket = $${paramCount}`);
            values.push(bracket);
            paramCount++;
            updates.push(`league_id = $${paramCount}`);
            values.push(leagueId);
            paramCount++;
          }
        }
      }

      if (data.incomeType !== undefined) {
        updates.push(`income_type = $${paramCount}`);
        values.push(data.incomeType);
        paramCount++;
      }

      if (data.locationType !== undefined) {
        updates.push(`location_type = $${paramCount}`);
        values.push(data.locationType);
        paramCount++;
      }

      if (data.locationState !== undefined) {
        updates.push(`location_state = $${paramCount}`);
        values.push(data.locationState);
        paramCount++;
      }

      if (data.locationCity !== undefined) {
        updates.push(`location_city = $${paramCount}`);
        values.push(data.locationCity);
        paramCount++;
      }

      if (data.householdConfig !== undefined) {
        updates.push(`household_config = $${paramCount}`);
        values.push(JSON.stringify(data.householdConfig));
        paramCount++;
      }

      if (data.consentFlags !== undefined) {
        // Merge with existing consent flags
        const currentProfile = await this.getUserProfile(userId);
        if (currentProfile) {
          const mergedFlags = {
            ...currentProfile.consentFlags,
            ...data.consentFlags,
          };
          updates.push(`consent_flags = $${paramCount}`);
          values.push(JSON.stringify(mergedFlags));
          paramCount++;
        }
      }

      if (data.notificationPreferences !== undefined) {
        // Merge with existing notification preferences
        const currentProfile = await this.getUserProfile(userId);
        if (currentProfile) {
          const mergedPrefs = {
            ...currentProfile.notificationPreferences,
            ...data.notificationPreferences,
          };
          updates.push(`notification_preferences = $${paramCount}`);
          values.push(JSON.stringify(mergedPrefs));
          paramCount++;
        }
      }

      if (updates.length === 0) {
        await client.query('ROLLBACK');
        return await this.getUserProfile(userId);
      }

      values.push(userId);
      const query = `
        UPDATE user_profiles
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('User profile updated', { userId });
      return this.mapRowToUserProfile(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating user profile', { userId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Task 3.1.4: GET /users/{userId}/league endpoint - Get league assignment
   */
  async getLeagueAssignment(userId: string): Promise<{
    leagueId: string;
    bracket: IncomeBracket;
  } | null> {
    const query = 'SELECT league_id, income_bracket FROM user_profiles WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      leagueId: result.rows[0].league_id,
      bracket: result.rows[0].income_bracket,
    };
  }

  /**
   * Task 3.1.5: POST /users/{userId}/income endpoint - Submit income declaration
   */
  async updateIncome(
    userId: string,
    monthlyIncome: number
  ): Promise<UserProfile | null> {
    return this.updateUserProfile(userId, {
      declaredMonthlyIncome: monthlyIncome,
    });
  }

  /**
   * Task 3.1.6: GET /users/{userId}/settings endpoint - Get notification preferences
   */
  async getSettings(userId: string): Promise<any | null> {
    const query = 'SELECT notification_preferences, consent_flags FROM user_profiles WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      notificationPreferences: result.rows[0].notification_preferences,
      consentFlags: result.rows[0].consent_flags,
    };
  }

  /**
   * Task 3.1.7: PATCH /users/{userId}/settings endpoint - Update notification preferences
   */
  async updateSettings(
    userId: string,
    settings: {
      notificationPreferences?: any;
      consentFlags?: any;
    }
  ): Promise<any | null> {
    await this.updateUserProfile(userId, settings);
    return this.getSettings(userId);
  }

  /**
   * Helper method to map database row to UserProfile model
   */
  private mapRowToUserProfile(row: any): UserProfile {
    return {
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      kycStatus: row.kyc_status,
      kycVerifiedAt: row.kyc_verified_at,
      incomeProfile: {
        bracket: row.income_bracket,
        declaredMonthlyIncome: parseFloat(row.declared_monthly_income),
        incomeType: row.income_type,
      },
      locationProfile: {
        type: row.location_type,
        state: row.location_state,
        city: row.location_city,
      },
      leagueId: row.league_id,
      algorandAddress: row.algorand_address,
      sbtAssetId: row.sbt_asset_id,
      householdConfig: row.household_config,
      consentFlags: row.consent_flags,
      notificationPreferences: row.notification_preferences,
    };
  }
}

export default UserProfileRepository;
