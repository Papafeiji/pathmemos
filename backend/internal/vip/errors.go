// Package vip provides related functionality.
package vip

import stderrors "errors"

var (
	ErrFreeVIPAlreadyClaimed  = stderrors.New("free vip already claimed")
	ErrTrialVIPAlreadyClaimed = stderrors.New("trial vip already claimed")
	ErrInvalidVIP             = stderrors.New("invalid vip")
	ErrOperationInProgress    = stderrors.New("operation in progress")
)
