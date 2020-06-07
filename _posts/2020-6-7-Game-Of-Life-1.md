---
layout: post
title: Conway's Game of Life 1
---

Recently, I have been working on making a [Conway's Game of Life implementation in C](https://github.com/jakebacker/game-of-life-c).
The goal of this project is to create a few different implementations that focus on optimizing a specific aspect.

So far, I have created a very memory efficient implementation. I also plan to create a very fast implementation, and I may even try
and make one using C++ macros.

The main optimizations I have made to make the implementation memory efficient are using a 2D `char` array, as `char` is the smallest
data type in C. Each array index has one cell in it, although this could potentially be increased to holding two cells per index.
The second core optimization was to make updating the board an in place operation. This isn't a very fast operation as it requires
going over the entire board twice, but it is quite memory efficient.

This in place operation utilizes modulo division. The main idea is that during the first iteration of the cells, every time
the program gets to an alive cell, it adds 2 to the value of each adjacent cell. Cells that are divisible by 2 are dead, cells 
that are not are alive.

This creates the following table:

| Value  	 | Current Status 	 | Neighbors 	 | Next Status 	|
|:-----:	 |:--------------:	 |:---------:	 |:-----------:	|
|   0   	 |      Dead      	 |     0     	 |     Dead    	|
|   1   	 |      Alive     	 |     0     	 |     Dead    	|
|   2   	 |      Dead      	 |     1     	 |     Dead    	|
|   3   	 |      Alive     	 |     1     	 |     Dead    	|
|   4   	 |      Dead      	 |     2     	 |     Dead    	|
|   5   	 |      Alive     	 |     2     	 |    Alive    	|
|   6   	 |      Dead      	 |     3     	 |    Alive    	|
|   7   	 |      Alive     	 |     3     	 |    Alive    	|
|   8   	 |      Dead      	 |     4     	 |     Dead    	|
|   9   	 |      Alive     	 |     4     	 |     Dead    	|
|  ...  	 |       ...      	 |    ...    	 |     ...     	|

Based off this, the only numbers that I need to worry about are values 5, 6, and 7. If the cell contains any of these values,
it must be set to alive for the next iteration. Otherwise, it should be marked as dead.

In the second iteration, to have a slight time performance increase, I subtracted the values by 5, then casted them to 
unsigned integers, then checked if they were less than or equal to 2. This allows to check the value using only a single comparision 
and a single subtraction (casting has no real impact on performance).

One last thing I did to increase performance was to make sure to use row-major order when looping through the grid. This is 
important because the CPU's cache caches chunks of the array in a row-major way. When using row-major to loop through the elements,
it results in more cache hits than using column-major would.

At some point soon, I plan to implement some sort of quantitative measurements into the program to get more exact performance 
and memory usage numbers.