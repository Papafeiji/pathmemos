package file

import "errors"

var (
	ErrNotFileOwner     = errors.New("file does not belong to user")
	ErrSystemFileDelete = errors.New("system file cannot be deleted via api")
	ErrFileNotFound     = errors.New("file not found")
	ErrFileInUse        = errors.New("file is still in use")
)
