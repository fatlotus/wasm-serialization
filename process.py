#!/usr/bin/env python
# Horrible Python script to make all globals in a WAT file mutable and exported
# (and validate that the program memory is accessible).

mem_exported = False
for line in open("main.wat"):
    print(line.rstrip())

    if "(global" in line:
        if "mut" not in line:
            raise ValueError("non-mutable global: %s" % repr(line))
        name = line.split()[1][2:-2]
        print("  (export \"glob%s\" (global %s))\n" % (name, name))

    if "(export" in line and "(memory" in line:
        mem_exported = True

if not mem_exported:
    raise ValueError("memory not exported")
