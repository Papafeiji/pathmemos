// Package errors defines business and HTTP error codes for the application.
package errors

import "net/http"

const (
	CodeSuccess       = "0000"
	CodeBadRequest    = "4000"
	CodeUnauthorized  = "4010"
	CodeForbidden     = "4030"
	CodeInternalError = "5001"
)

const (
	BizTokenExpired           = "1006"
	BizSessionInvalid         = "SESSION_INVALID"
	BizLoginConflict          = "LOGIN_CONFLICT"
	BizPhoneAlreadyBound      = "PHONE_ALREADY_BOUND"
	BizFamilyNotFound         = "FAMILY_NOT_FOUND"
	BizTargetIsPersonalFamily = "TARGET_IS_PERSONAL_FAMILY"
	BizAlreadyInTargetFamily  = "ALREADY_IN_TARGET_FAMILY"
	BizOwnerCannotLeaveFamily = "OWNER_CANNOT_LEAVE_FAMILY"
	BizFamilyFull             = "FAMILY_FULL"
	BizCannotRemoveSelf       = "CANNOT_REMOVE_SELF"
	BizCannotRemoveOwner      = "CANNOT_REMOVE_OWNER"
	BizNotVip                 = "NOT_VIP"
	BizFreeVipAlreadyClaimed  = "FREE_VIP_ALREADY_CLAIMED"
	BizTrialVipAlreadyClaimed = "TRIAL_VIP_ALREADY_CLAIMED"
	BizOrderNotFound          = "ORDER_NOT_FOUND"
	BizVIPNotFound            = "VIP_NOT_FOUND"
	BizOrderNotPending        = "ORDER_NOT_PENDING"
	BizAlreadyInFamily        = "ALREADY_IN_FAMILY"
	BizOperationInProgress    = "OPERATION_IN_PROGRESS"
	BizInvalidFileType        = "INVALID_FILE_TYPE"
	BizFileSizeExceeded       = "FILE_SIZE_EXCEEDED"
	BizInvalidColorFormat     = "INVALID_COLOR_FORMAT"
	BizTextTooLong            = "TEXT_TOO_LONG"
	BizInvalidCoordinates     = "INVALID_COORDINATES"
	BizNicknameInvalid        = "NICKNAME_INVALID"
	BizAIDailyQuotaExceeded   = "AI_DAILY_QUOTA_EXCEEDED"
	BizNotInNormalFamily      = "NOT_IN_NORMAL_FAMILY"
	BizAlreadyInOtherFamily   = "ALREADY_IN_OTHER_FAMILY"
	BizRateLimited            = "RATE_LIMITED"
)

func HTTPStatus(bizCode string) int {
	switch bizCode {
	case BizFamilyNotFound, BizOrderNotFound, BizVIPNotFound:
		return http.StatusNotFound
	case BizTargetIsPersonalFamily, BizOwnerCannotLeaveFamily, BizCannotRemoveSelf, BizCannotRemoveOwner, BizNotVip:
		return http.StatusForbidden
	case BizLoginConflict, BizPhoneAlreadyBound, BizAlreadyInTargetFamily, BizOrderNotPending, BizAlreadyInFamily, BizFamilyFull, BizFreeVipAlreadyClaimed, BizTrialVipAlreadyClaimed, BizAlreadyInOtherFamily:
		return http.StatusConflict
	case BizOperationInProgress, BizRateLimited:
		return http.StatusTooManyRequests
	default:
		return http.StatusBadRequest
	}
}
