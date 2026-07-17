// Package timeutil provides time-related helpers.
package timeutil

import "time"

var Shanghai *time.Location

func init() {
	var err error
	Shanghai, err = time.LoadLocation("Asia/Shanghai")
	if err != nil {
		Shanghai = time.FixedZone("Asia/Shanghai", 8*60*60)
	}
}

func NowShanghai() time.Time {
	return time.Now().In(Shanghai)
}
