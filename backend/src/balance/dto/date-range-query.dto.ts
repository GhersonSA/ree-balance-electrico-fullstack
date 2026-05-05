import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class DateRangeQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : undefined,
  )
  @IsOptional()
  @IsIn(['day', 'month'])
  timeTrunc?: string = 'day';

  @IsOptional()
  @IsString()
  @Length(1, 120)
  indicatorType?: string;
}
