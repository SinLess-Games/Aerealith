export type ApiMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'

export type ApiMeta = {
  requestId?: string
  timestamp?: string
  path?: string
}

export type ApiError<TCode extends string = string> = {
  code: TCode
  message: string
  details?: unknown
}

export type ApiSuccessResponse<TData = unknown> = {
  ok: true
  data: TData
  meta?: ApiMeta
}

export type ApiErrorResponse<TCode extends string = string> = {
  ok: false
  error: ApiError<TCode>
  meta?: ApiMeta
}

export type ApiResponse<TData = unknown, TCode extends string = string> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse<TCode>

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PaginatedData<TItem> = {
  items: TItem[]
  pagination: PaginationMeta
}

export type PaginatedResponse<
  TItem,
  TCode extends string = string,
> = ApiResponse<PaginatedData<TItem>, TCode>

export type IsoDateString = string
