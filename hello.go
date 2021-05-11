package main

import (
	"fmt"
	"syscall/js"
	"time"
)

func main() {
	for i := 0; i < 300; i++ {
		js.Global().Call("printLogMessage", fmt.Sprintf("i=%d\n", i))
		time.Sleep(1 * time.Second)
	}
}
