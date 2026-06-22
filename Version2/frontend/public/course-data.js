window.COURSE_DATA = [
  {
    "type": "tutorial",
    "number": 1,
    "title": "Lesson 1: print()",
    "url": "print().html",
    "html": "<h2>Print statements</h2>\n<p>In Python, to display something on the screen when you run the code, you use the print() function.</p>\n<h3>Example:</h3>\n<pre><code>print(&quot;Harry&quot;)</code></pre>\n<p>will display</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Try to display your name</li>\n  <li>Try to display your age</li>\n  <li>Try to break it, what happens if you have a capital P or if you don&#x27;t have quotation marks?</li>\n  <li>Figure out how to get your first name to display on one line and your second name on another</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 2,
    "title": "Lesson 2: variables",
    "url": "variables.html",
    "html": "<h2>Variables</h2>\n<p>A variable is a name that stores a value</p>\n<p>The value could be anything, a number, a string or a boolean</p>\n<p>You create a variable by writing the variable name, then an equals sign, then the value.</p>\n<h3>Example:</h3>\n<pre><code>name = &quot;Harry&quot;\nage = 16\nis_student = True\n\nprint(name)\nprint(age)\nprint(is_student)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry\n&gt;&gt;&gt; 16\n&gt;&gt;&gt; True</code></pre>\n<hr>\n<h3>What is a string?</h3>\n<p>A string is a piece of text in Python.</p>\n<p>You create a string by putting text inside quotes.</p>\n<p>This text can be any text, not just letters.</p>\n<h4>Example:</h4>\n<pre><code>&quot;Name&quot;, &quot;9&quot;, &quot;True&quot;, &quot;6.3&quot;</code></pre>\n<hr>\n<h3>What is a boolean?</h3>\n<p>A boolean value is a value that is either true or false, like a light switch. This is used when checking an on/off value in a program, eg. is a door opened or not.</p>\n<h4>Example:</h4>\n<pre><code>True, False</code></pre>\n<p>By the way, the capitalisation is important.</p>\n<hr>\n<h3>What is an integer?</h3>\n<p>Integers in Python are whole numbers without a decimal point. The difference between integers and strings is that integers are not enclosed within quotation marks.</p>\n<h4>Example:</h4>\n<pre><code>9, 5</code></pre>\n<hr>\n<h3>What is a float?</h3>\n<p>A float value is a value that is a decimal number</p>\n<h4>Example:</h4>\n<pre><code>9.0, 5.5565</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a variable for your name and print it</li>\n  <li>Make a variable for your age and print it</li>\n  <li>Change the value of a variable after you create it</li>\n  <li>Make three variables: one string, one integer and one boolean</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 3,
    "title": "Lesson 3: input()",
    "url": "input().html",
    "html": "<h2>Input()</h2>\n<p>The input() function is used to take in user input.</p>\n<p>User input is any data a user enters into a program.</p>\n<hr>\n<h3>Input() usage</h3>\n<p>Anything inside the brackets will be displayed before the user types their answer.</p>\n<pre><code>name = input(&quot;Enter your name: &quot;)\nprint(name)</code></pre>\n<p>If the user types Harry, it will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Enter your name: Harry\n&gt;&gt;&gt; Harry</code></pre>\n<hr>\n<h3>Important</h3>\n<p>The input() function always gives you a string, even if the user types a number.</p>\n<h4>Example:</h4>\n<pre><code>age = input(&quot;Enter your age: &quot;)\nprint(type(age))</code></pre>\n<p>If the user types 16, it will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; str</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for their name and print it</li>\n  <li>Ask the user for their favourite colour and print it</li>\n  <li>Ask the user for their age and print the type of the answer</li>\n  <li>Try putting nothing inside the input brackets. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 4,
    "title": "Lesson 4: type conversion",
    "url": "type-conversion.html",
    "html": "<h2>Variable conversion and types</h2>\n<p>Every value in Python has a type.</p>\n<p>The main types you have seen so far are string, integer, float and boolean.</p>\n<hr>\n<h3>Checking a type</h3>\n<p>You can use the type() function to check the type of a value.</p>\n<h4>Example:</h4>\n<pre><code>age = 16\nprint(type(age))</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; &lt;class &#x27;int&#x27;&gt;</code></pre>\n<hr>\n<h3>Type casting</h3>\n<p>Type casting means changing a value from one type into another type.</p>\n<ul>\n  <li>int() changes a value into an integer</li>\n  <li>float() changes a value into a float</li>\n  <li>str() changes a value into a string</li>\n  <li>bool() changes a value into a boolean</li>\n</ul>\n<h4>Example:</h4>\n<pre><code>age = input(&quot;Enter your age: &quot;)\nage = int(age)\nprint(age + 1)</code></pre>\n<p>If the user types 16, it will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 17</code></pre>\n<hr>\n<h3>Strings and numbers</h3>\n<p>The string &quot;2&quot; and the integer 2 are different.</p>\n<h4>Example:</h4>\n<pre><code>print(&quot;2&quot; + &quot;2&quot;)\nprint(2 + 2)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 22\n&gt;&gt;&gt; 4</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for two numbers and add them together</li>\n  <li>Print the type of a value before and after casting it</li>\n  <li>Try to cast &quot;hello&quot; into an integer. What happens?</li>\n  <li>Try to cast 5.9 into an integer. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 5,
    "title": "Lesson 5: if/elif/else",
    "url": "if-elif-else.html",
    "html": "<h2>If, elif and else statements</h2>\n<p>If statements let your program make decisions.</p>\n<p>They run code only if a condition is true.</p>\n<hr>\n<h3>If</h3>\n<h4>Example:</h4>\n<pre><code>age = 18\n\nif age &gt;= 18:\n    print(&quot;You are an adult&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; You are an adult</code></pre>\n<hr>\n<h3>Else</h3>\n<p>The else part runs when the if condition is false.</p>\n<h4>Example:</h4>\n<pre><code>age = 15\n\nif age &gt;= 18:\n    print(&quot;You are an adult&quot;)\nelse:\n    print(&quot;You are not an adult&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; You are not an adult</code></pre>\n<hr>\n<h3>Elif</h3>\n<p>Elif means else if.</p>\n<p>It lets you check another condition.</p>\n<h4>Example:</h4>\n<pre><code>mark = 65\n\nif mark &gt;= 80:\n    print(&quot;Distinction&quot;)\nelif mark &gt;= 50:\n    print(&quot;Pass&quot;)\nelse:\n    print(&quot;Fail&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Pass</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for their age and check if they are old enough to drive</li>\n  <li>Make a program that checks if a number is positive, negative or zero</li>\n  <li>Make a program that checks if a password is correct</li>\n  <li>Try forgetting the colon after an if statement. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 6,
    "title": "Lesson 6: string manipulation",
    "url": "string-manipulation.html",
    "html": "<h2>String manipulation</h2>\n<p>String manipulation means changing or using text in different ways.</p>\n<hr>\n<h3>Joining strings</h3>\n<p>You can join strings together using the + symbol.</p>\n<h4>Example:</h4>\n<pre><code>first_name = &quot;Harry&quot;\nsecond_name = &quot;Murphy&quot;\n\nprint(first_name + &quot; &quot; + second_name)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry Murphy</code></pre>\n<hr>\n<h3>String methods</h3>\n<p>Python has useful methods for strings.</p>\n<h4>Example:</h4>\n<pre><code>message = &quot;hello&quot;\n\nprint(message.upper())\nprint(message.capitalize())</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; HELLO\n&gt;&gt;&gt; Hello</code></pre>\n<hr>\n<h3>Indexing strings</h3>\n<p>You can get one character from a string using its index.</p>\n<p>Python starts counting from 0.</p>\n<h4>Example:</h4>\n<pre><code>word = &quot;Python&quot;\nprint(word[0])\nprint(word[1])</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; P\n&gt;&gt;&gt; y</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for their first name and second name, then print their full name</li>\n  <li>Print a word in uppercase</li>\n  <li>Print the first letter of your name</li>\n  <li>Try to print a letter using an index that is too big. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 7,
    "title": "Lesson 7: list manipulation",
    "url": "list-manipulation.html",
    "html": "<h2>List manipulation</h2>\n<p>A list stores multiple values in one variable.</p>\n<p>Lists use square brackets.</p>\n<h4>Example:</h4>\n<pre><code>names = [&quot;Harry&quot;, &quot;Sarah&quot;, &quot;John&quot;]\nprint(names)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; [&#x27;Harry&#x27;, &#x27;Sarah&#x27;, &#x27;John&#x27;]</code></pre>\n<hr>\n<h3>Indexing lists</h3>\n<p>You can get one item from a list using its index.</p>\n<p>Python starts counting from 0.</p>\n<h4>Example:</h4>\n<pre><code>names = [&quot;Harry&quot;, &quot;Sarah&quot;, &quot;John&quot;]\nprint(names[0])</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry</code></pre>\n<hr>\n<h3>Changing a list</h3>\n<p>You can add, remove and change items in a list.</p>\n<h4>Example:</h4>\n<pre><code>numbers = [1, 2, 3]\n\nnumbers.append(4)\nnumbers.remove(2)\nnumbers[0] = 10\n\nprint(numbers)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; [10, 3, 4]</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a list of three favourite foods</li>\n  <li>Print the first item in the list</li>\n  <li>Add another item to the list</li>\n  <li>Remove one item from the list</li>\n  <li>Change one item in the list</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 8,
    "title": "Lesson 8: for loops",
    "url": "for-loops.html",
    "html": "<h2>For loops</h2>\n<p>A for loop repeats code for each item in a sequence.</p>\n<hr>\n<h3>Looping through a list</h3>\n<h4>Example:</h4>\n<pre><code>names = [&quot;Harry&quot;, &quot;Sarah&quot;, &quot;John&quot;]\n\nfor name in names:\n    print(name)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry\n&gt;&gt;&gt; Sarah\n&gt;&gt;&gt; John</code></pre>\n<hr>\n<h3>Using range()</h3>\n<p>The range() function is useful when you want to repeat code a certain number of times.</p>\n<h4>Example:</h4>\n<pre><code>for number in range(5):\n    print(number)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 0\n&gt;&gt;&gt; 1\n&gt;&gt;&gt; 2\n&gt;&gt;&gt; 3\n&gt;&gt;&gt; 4</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Print your name five times using a for loop</li>\n  <li>Print the numbers from 0 to 9</li>\n  <li>Make a list of subjects and print each one</li>\n  <li>Try changing range(5) to range(1, 6). What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 9,
    "title": "Lesson 9: while loops",
    "url": "while-loops.html",
    "html": "<h2>While loops</h2>\n<p>A while loop repeats code while a condition is true.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>counter = 1\n\nwhile counter &lt;= 5:\n    print(counter)\n    counter = counter + 1</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 1\n&gt;&gt;&gt; 2\n&gt;&gt;&gt; 3\n&gt;&gt;&gt; 4\n&gt;&gt;&gt; 5</code></pre>\n<hr>\n<h3>Infinite loops</h3>\n<p>If the condition never becomes false, the loop will keep going.</p>\n<h4>Example:</h4>\n<pre><code>counter = 1\n\nwhile counter &lt;= 5:\n    print(counter)</code></pre>\n<p>This loop does not change counter, so it will not stop by itself.</p>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Print the numbers from 1 to 10 using a while loop</li>\n  <li>Ask the user to enter a password until they enter the correct one</li>\n  <li>Make a countdown from 5 to 1</li>\n  <li>Try making an infinite loop, then stop the program</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 10,
    "title": "Lesson 10: nested if statements",
    "url": "nested-if-statements.html",
    "html": "<h2>Nested ifs</h2>\n<p>A nested if is an if statement inside another if statement.</p>\n<p>This is useful when you only want to check something after another condition is true.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>age = 18\nhas_ticket = True\n\nif age &gt;= 18:\n    if has_ticket == True:\n        print(&quot;You can enter&quot;)\n    else:\n        print(&quot;You need a ticket&quot;)\nelse:\n    print(&quot;You are too young&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; You can enter</code></pre>\n<hr>\n<h3>Indentation</h3>\n<p>Nested ifs need careful indentation.</p>\n<p>The spaces at the start of the line show Python which code belongs inside each if statement.</p>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Check if someone is old enough to drive, then check if they have a licence</li>\n  <li>Check if a username is correct, then check if the password is correct</li>\n  <li>Change the example so has_ticket is False</li>\n  <li>Try changing the indentation. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 11,
    "title": "Lesson 11: dictionaries",
    "url": "dictionaries.html",
    "html": "<h2>Dictionaries</h2>\n<p>A dictionary stores data using keys and values.</p>\n<p>Lists use positions. Dictionaries use names.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>student = {\n    &quot;name&quot;: &quot;Harry&quot;,\n    &quot;age&quot;: 16,\n    &quot;year&quot;: 5\n}\n\nprint(student[&quot;name&quot;])</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry</code></pre>\n<hr>\n<h3>Changing a dictionary</h3>\n<p>You can add or change values using their key.</p>\n<h4>Example:</h4>\n<pre><code>student = {\n    &quot;name&quot;: &quot;Harry&quot;,\n    &quot;age&quot;: 16\n}\n\nstudent[&quot;age&quot;] = 17\nstudent[&quot;subject&quot;] = &quot;Computer Science&quot;\n\nprint(student)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; {&#x27;name&#x27;: &#x27;Harry&#x27;, &#x27;age&#x27;: 17, &#x27;subject&#x27;: &#x27;Computer Science&#x27;}</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a dictionary for yourself with name, age and favourite subject</li>\n  <li>Print one value from the dictionary</li>\n  <li>Change one value in the dictionary</li>\n  <li>Add a new key and value to the dictionary</li>\n  <li>Try to print a key that does not exist. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 12,
    "title": "Lesson 12: try except",
    "url": "try-except.html",
    "html": "<h2>Try except</h2>\n<p>Try except is used to handle errors.</p>\n<p>It stops your program from crashing when something goes wrong.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>number = input(&quot;Enter a number: &quot;)\n\ntry:\n    number = int(number)\n    print(number + 10)\nexcept:\n    print(&quot;That was not a number&quot;)</code></pre>\n<p>If the user types 5, it will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 15</code></pre>\n<p>If the user types hello, it will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; That was not a number</code></pre>\n<hr>\n<h3>Why use it?</h3>\n<p>User input can be unpredictable.</p>\n<p>Try except lets your program react to bad input instead of stopping.</p>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for their age and use try except when converting it to an integer</li>\n  <li>Make a calculator that handles bad number input</li>\n  <li>Try dividing by zero inside a try block</li>\n  <li>Change the except message to something clearer</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 13,
    "title": "Lesson 13: functions",
    "url": "functions.html",
    "html": "<h2>Functions</h2>\n<p>A function is a reusable block of code.</p>\n<p>You can write the code once, then call it whenever you need it.</p>\n<hr>\n<h3>Creating a function</h3>\n<p>You create a function using def.</p>\n<h4>Example:</h4>\n<pre><code>def say_hello():\n    print(&quot;Hello&quot;)\n\nsay_hello()</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Hello</code></pre>\n<hr>\n<h3>Parameters</h3>\n<p>Parameters let you send values into a function.</p>\n<h4>Example:</h4>\n<pre><code>def greet(name):\n    print(&quot;Hello &quot; + name)\n\ngreet(&quot;Harry&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Hello Harry</code></pre>\n<hr>\n<h3>Return</h3>\n<p>Return sends a value back from a function.</p>\n<h4>Example:</h4>\n<pre><code>def add(number1, number2):\n    return number1 + number2\n\nresult = add(3, 4)\nprint(result)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 7</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a function that prints your name</li>\n  <li>Make a function that takes a name and greets the person</li>\n  <li>Make a function that adds two numbers and returns the answer</li>\n  <li>Call the same function more than once</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 14,
    "title": "Lesson 14: ternary operators",
    "url": "ternary-operators.html",
    "html": "<h2>Ternary expressions</h2>\n<p>A ternary expression is a short way to write a simple if else statement.</p>\n<hr>\n<h3>Normal if else</h3>\n<h4>Example:</h4>\n<pre><code>age = 18\n\nif age &gt;= 18:\n    message = &quot;Adult&quot;\nelse:\n    message = &quot;Not adult&quot;\n\nprint(message)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Adult</code></pre>\n<hr>\n<h3>Ternary expression</h3>\n<p>The same code can be written in one line.</p>\n<h4>Example:</h4>\n<pre><code>age = 18\nmessage = &quot;Adult&quot; if age &gt;= 18 else &quot;Not adult&quot;\n\nprint(message)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Adult</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a ternary expression that checks if a number is even or odd</li>\n  <li>Make a ternary expression that checks if someone passed or failed a test</li>\n  <li>Rewrite a normal if else statement as a ternary expression</li>\n  <li>Decide when a ternary expression is harder to read than a normal if else</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 15,
    "title": "Lesson 15: nested loops",
    "url": "nested-loops.html",
    "html": "<h2>Nested loops</h2>\n<p>A nested loop is a loop inside another loop.</p>\n<p>The inner loop runs fully each time the outer loop runs once.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>for row in range(3):\n    for column in range(3):\n        print(&quot;Row&quot;, row, &quot;Column&quot;, column)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Row 0 Column 0\n&gt;&gt;&gt; Row 0 Column 1\n&gt;&gt;&gt; Row 0 Column 2\n&gt;&gt;&gt; Row 1 Column 0\n&gt;&gt;&gt; Row 1 Column 1\n&gt;&gt;&gt; Row 1 Column 2\n&gt;&gt;&gt; Row 2 Column 0\n&gt;&gt;&gt; Row 2 Column 1\n&gt;&gt;&gt; Row 2 Column 2</code></pre>\n<hr>\n<h3>Grid example</h3>\n<h4>Example:</h4>\n<pre><code>for row in range(3):\n    for column in range(3):\n        print(&quot;*&quot;, end=&quot;&quot;)\n    print()</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; ***\n&gt;&gt;&gt; ***\n&gt;&gt;&gt; ***</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Print a 5 by 5 square of stars</li>\n  <li>Print a triangle of stars</li>\n  <li>Use nested loops to print every pair of numbers from 1 to 3</li>\n  <li>Change the size of the grid using a variable</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 16,
    "title": "Lesson 16: match case",
    "url": "match-case.html",
    "html": "<h2>Match case</h2>\n<p>Match case is another way to make decisions in Python.</p>\n<p>It is useful when you are checking one value against different options.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>day = &quot;Monday&quot;\n\nmatch day:\n    case &quot;Monday&quot;:\n        print(&quot;Start of the week&quot;)\n    case &quot;Friday&quot;:\n        print(&quot;Almost the weekend&quot;)\n    case &quot;Saturday&quot; | &quot;Sunday&quot;:\n        print(&quot;Weekend&quot;)\n    case _:\n        print(&quot;Normal day&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Start of the week</code></pre>\n<hr>\n<h3>Default case</h3>\n<p>The case _ part is used when none of the other cases match.</p>\n<p>It works like else.</p>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Ask the user for a day of the week and print a message</li>\n  <li>Make a menu where the user chooses option 1, 2 or 3</li>\n  <li>Add a default case for an invalid choice</li>\n  <li>Rewrite a match case program using if, elif and else</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 17,
    "title": "Lesson 17: static typing",
    "url": "static-typing.html",
    "html": "<h2>Static typing</h2>\n<p>Python is dynamically typed.</p>\n<p>This means you usually do not have to write the type of a variable.</p>\n<p>Static typing uses type hints to show what type a value should be.</p>\n<hr>\n<h3>Variable type hints</h3>\n<h4>Example:</h4>\n<pre><code>name: str = &quot;Harry&quot;\nage: int = 16\nheight: float = 1.75\nis_student: bool = True</code></pre>\n<p>Type hints do not change how the program runs, but they make the code easier to understand.</p>\n<hr>\n<h3>Function type hints</h3>\n<h4>Example:</h4>\n<pre><code>def add(number1: int, number2: int) -&gt; int:\n    return number1 + number2\n\nprint(add(3, 4))</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 7</code></pre>\n<hr>\n<h3>Important</h3>\n<p>Python will still run this:</p>\n<pre><code>age: int = &quot;sixteen&quot;</code></pre>\n<p>The type hint is a helpful note, not a strict rule by itself.</p>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Add type hints to variables for your name, age and favourite subject</li>\n  <li>Add type hints to a function that multiplies two numbers</li>\n  <li>Try putting the wrong type into a hinted variable</li>\n  <li>Explain why type hints can help another programmer</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 18,
    "title": "Lesson 18: classes",
    "url": "classes.html",
    "html": "<h2>Classes</h2>\n<p>A class is a blueprint for creating objects.</p>\n<p>An object can store data and have functions that belong to it.</p>\n<hr>\n<h3>Creating a class</h3>\n<h4>Example:</h4>\n<pre><code>class Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\nstudent1 = Student(&quot;Harry&quot;, 16)\n\nprint(student1.name)\nprint(student1.age)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Harry\n&gt;&gt;&gt; 16</code></pre>\n<hr>\n<h3>Methods</h3>\n<p>A method is a function inside a class.</p>\n<h4>Example:</h4>\n<pre><code>class Student:\n    def __init__(self, name):\n        self.name = name\n\n    def say_hello(self):\n        print(&quot;Hello, my name is &quot; + self.name)\n\nstudent1 = Student(&quot;Harry&quot;)\nstudent1.say_hello()</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Hello, my name is Harry</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Create a class called Dog with a name and age</li>\n  <li>Create two objects from the same class</li>\n  <li>Add a method that prints a sentence about the object</li>\n  <li>Try printing an attribute that does not exist. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 19,
    "title": "Lesson 19: OOP",
    "url": "oop.html",
    "html": "<h2>OOP</h2>\n<p>OOP means Object-Oriented Programming.</p>\n<p>It is a way of organising code using classes and objects.</p>\n<hr>\n<h3>Why use OOP?</h3>\n<p>OOP helps you keep related data and functions together.</p>\n<p>For example, a Player object might store its name, health and score.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>class Player:\n    def __init__(self, name):\n        self.name = name\n        self.health = 100\n        self.score = 0\n\n    def take_damage(self, amount):\n        self.health = self.health - amount\n\n    def add_score(self, points):\n        self.score = self.score + points\n\nplayer1 = Player(&quot;Harry&quot;)\nplayer1.take_damage(20)\nplayer1.add_score(10)\n\nprint(player1.health)\nprint(player1.score)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 80\n&gt;&gt;&gt; 10</code></pre>\n<hr>\n<h3>Objects are separate</h3>\n<p>Each object has its own data.</p>\n<h4>Example:</h4>\n<pre><code>player1 = Player(&quot;Harry&quot;)\nplayer2 = Player(&quot;Sarah&quot;)\n\nplayer1.add_score(10)\n\nprint(player1.score)\nprint(player2.score)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 10\n&gt;&gt;&gt; 0</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Create a Player class with name, health and score</li>\n  <li>Make methods to change the health and score</li>\n  <li>Create two different players</li>\n  <li>Show that changing one player does not change the other player</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 20,
    "title": "Lesson 20: recursion",
    "url": "recursion.html",
    "html": "<h2>Recursion</h2>\n<p>Recursion is when a function calls itself.</p>\n<p>It is useful for problems that can be broken into smaller versions of the same problem.</p>\n<hr>\n<h3>Example:</h3>\n<pre><code>def countdown(number):\n    print(number)\n\n    if number &gt; 1:\n        countdown(number - 1)\n\ncountdown(5)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 5\n&gt;&gt;&gt; 4\n&gt;&gt;&gt; 3\n&gt;&gt;&gt; 2\n&gt;&gt;&gt; 1</code></pre>\n<hr>\n<h3>Base case</h3>\n<p>A recursive function needs a base case.</p>\n<p>The base case is the condition that stops the recursion.</p>\n<p>Without a base case, the function will call itself forever.</p>\n<hr>\n<h3>Factorial example</h3>\n<p>Factorial means multiplying a number by every whole number below it.</p>\n<h4>Example:</h4>\n<pre><code>def factorial(number):\n    if number == 1:\n        return 1\n    else:\n        return number * factorial(number - 1)\n\nprint(factorial(5))</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 120</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Make a recursive function that counts down from 10</li>\n  <li>Change the countdown so it stops at 0</li>\n  <li>Find the base case in the factorial example</li>\n  <li>Try removing the base case. What happens?</li>\n</ul>"
  },
  {
    "type": "tutorial",
    "number": 21,
    "title": "Lesson 21: advanced data algorithms",
    "url": "advanced-data-algorithms.html",
    "html": "<h2>Advanced data algorithms</h2>\n<p>An algorithm is a set of steps used to solve a problem.</p>\n<p>Advanced data algorithms often work with lists, dictionaries and other data structures.</p>\n<hr>\n<h3>Searching a list</h3>\n<p>Searching means finding an item in a list.</p>\n<h4>Example:</h4>\n<pre><code>names = [&quot;Harry&quot;, &quot;Sarah&quot;, &quot;John&quot;]\ntarget = &quot;Sarah&quot;\n\nfor name in names:\n    if name == target:\n        print(&quot;Found&quot;)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; Found</code></pre>\n<hr>\n<h3>Finding the largest number</h3>\n<h4>Example:</h4>\n<pre><code>numbers = [4, 9, 2, 7]\nlargest = numbers[0]\n\nfor number in numbers:\n    if number &gt; largest:\n        largest = number\n\nprint(largest)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; 9</code></pre>\n<hr>\n<h3>Counting items</h3>\n<p>Dictionaries can be used to count how many times values appear.</p>\n<h4>Example:</h4>\n<pre><code>words = [&quot;red&quot;, &quot;blue&quot;, &quot;red&quot;, &quot;green&quot;, &quot;blue&quot;, &quot;red&quot;]\ncounts = {}\n\nfor word in words:\n    if word in counts:\n        counts[word] = counts[word] + 1\n    else:\n        counts[word] = 1\n\nprint(counts)</code></pre>\n<p>will display:</p>\n<pre class=\"terminal-output\"><code>&gt;&gt;&gt; {&#x27;red&#x27;: 3, &#x27;blue&#x27;: 2, &#x27;green&#x27;: 1}</code></pre>\n<h2>Try it yourself</h2>\n<ul>\n  <li>Search a list for a name entered by the user</li>\n  <li>Find the smallest number in a list</li>\n  <li>Count how many times each letter appears in a word</li>\n  <li>Sort a list using sorted() and compare it to your own searching code</li>\n</ul>"
  },
  {
    "type": "challenge",
    "number": 1,
    "title": "Challenge 1",
    "url": "challenge1.html",
    "html": "<h3>Challenge 1</h3>\n<p>Print the name Paddy.</p>\n<h3>Challenge 2</h3>\n<p>Print Paddy, 16, and Computer Science on three separate lines.</p>\n<h3>Challenge 3</h3>\n<p>Print a small menu that looks like this:</p>\n<pre><code>1. Play\n2. Settings\n3. Quit</code></pre>\n<h3>Challenge 4</h3>\n<p>Print this star drawing exactly as shown:</p>\n<pre><code>***\n* *\n***</code></pre>\n<h3>Challenge 5</h3>\n<p>Print this fake receipt exactly as shown:</p>\n<pre><code>PythonPages Shop\nPencil - 1.50\nNotebook - 2.00\nTotal - 3.50</code></pre>",
    "tasks": [
      {
        "id": "print-name",
        "title": "Print a name",
        "prompt": "Print the name Paddy.",
        "visibleExample": {
          "input": [],
          "output": "Paddy"
        },
        "tests": [
          {
            "id": "print-name-output",
            "name": "Prints the expected name",
            "input": [],
            "expectedOutput": "Paddy",
            "match": "exact",
            "visible": true
          },
          {
            "id": "print-name-lines",
            "name": "Uses one output line",
            "input": [],
            "expectedLineCount": 1,
            "match": "line-count"
          }
        ],
        "hints": [
          "Use one print() statement with the name inside quotation marks.",
          "Check the capital P and make sure you only print Paddy."
        ]
      },
      {
        "id": "three-lines",
        "title": "Print three lines",
        "prompt": "Print Paddy, 16, and Computer Science on three separate lines.",
        "visibleExample": {
          "input": [],
          "output": "Paddy\n16\nComputer Science"
        },
        "tests": [
          {
            "id": "three-lines-output",
            "name": "Prints the expected details",
            "input": [],
            "expectedOutput": "Paddy\n16\nComputer Science",
            "match": "exact",
            "visible": true
          },
          {
            "id": "three-lines-count",
            "name": "Uses three output lines",
            "input": [],
            "expectedLineCount": 3,
            "match": "line-count"
          }
        ],
        "hints": [
          "Use three separate print() statements.",
          "Each value should appear on its own line in the same order as the task."
        ]
      },
      {
        "id": "small-menu",
        "title": "Print a menu",
        "prompt": "Print the three-line menu exactly as shown.",
        "visibleExample": {
          "input": [],
          "output": "1. Play\n2. Settings\n3. Quit"
        },
        "tests": [
          {
            "id": "small-menu-output",
            "name": "Prints the expected menu",
            "input": [],
            "expectedOutput": "1. Play\n2. Settings\n3. Quit",
            "match": "exact",
            "visible": true
          }
        ],
        "hints": [
          "Use one print() for each menu option.",
          "Check the numbers, full stops, capital letters, and spaces."
        ]
      },
      {
        "id": "star-drawing",
        "title": "Print a drawing",
        "prompt": "Print this three-line star drawing exactly as shown.",
        "visibleExample": {
          "input": [],
          "output": "***\n* *\n***"
        },
        "tests": [
          {
            "id": "star-drawing-output",
            "name": "Prints the expected drawing",
            "input": [],
            "expectedOutput": "***\n* *\n***",
            "match": "exact",
            "visible": true
          }
        ],
        "hints": [
          "Use three print() statements for the three rows.",
          "The middle row needs a space between the two stars."
        ]
      },
      {
        "id": "fake-receipt",
        "title": "Print a receipt",
        "prompt": "Print this four-line fake receipt exactly as shown.",
        "visibleExample": {
          "input": [],
          "output": "PythonPages Shop\nPencil - 1.50\nNotebook - 2.00\nTotal - 3.50"
        },
        "tests": [
          {
            "id": "fake-receipt-output",
            "name": "Prints the expected receipt",
            "input": [],
            "expectedOutput": "PythonPages Shop\nPencil - 1.50\nNotebook - 2.00\nTotal - 3.50",
            "match": "exact",
            "visible": true
          }
        ],
        "hints": [
          "Use four print() statements, one for each receipt line.",
          "Check the item names, hyphens, prices, and total."
        ]
      }
    ]
  },
  {
    "type": "challenge",
    "number": 2,
    "title": "Challenge 2",
    "url": "challenge2.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a variable called name and print it.</p>\n<h3>Challenge 2</h3>\n<p>Create variables for your name, age and favourite food. Print each one.</p>\n<h3>Challenge 3</h3>\n<p>Create two number variables and print their total.</p>\n<h3>Challenge 4</h3>\n<p>Create a score variable. Print it, increase it by 10, then print it again.</p>\n<h3>Challenge 5</h3>\n<p>Create variables for a character in a game: name, health, level and is_alive. Print a character profile using these variables.</p>"
  },
  {
    "type": "challenge",
    "number": 3,
    "title": "Challenge 3",
    "url": "challenge3.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for their name and print it back to them.</p>\n<h3>Challenge 2</h3>\n<p>Ask the user for their favourite film and print a sentence using their answer.</p>\n<h3>Challenge 3</h3>\n<p>Ask for a username and password, then print both answers.</p>\n<h3>Challenge 4</h3>\n<p>Ask the user for three pieces of information about themselves and print a short profile.</p>\n<h3>Challenge 5</h3>\n<p>Create a text adventure introduction that asks for the player&#x27;s name, weapon and destination, then prints the start of their story.</p>"
  },
  {
    "type": "challenge",
    "number": 4,
    "title": "Challenge 4",
    "url": "challenge4.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for their age, convert it to an integer and print it.</p>\n<h3>Challenge 2</h3>\n<p>Ask the user for two numbers, convert them to integers and print their total.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user for the price of an item and convert it to a float.</p>\n<h3>Challenge 4</h3>\n<p>Ask the user for their birth year and calculate their age.</p>\n<h3>Challenge 5</h3>\n<p>Create a simple calculator that asks for two numbers and prints the answer for addition, subtraction, multiplication and division.</p>"
  },
  {
    "type": "challenge",
    "number": 5,
    "title": "Challenge 5",
    "url": "challenge5.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for their age and print whether they are 18 or older.</p>\n<h3>Challenge 2</h3>\n<p>Ask the user for a number and print whether it is positive, negative or zero.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user for a test score and print Fail, Pass or Distinction.</p>\n<h3>Challenge 4</h3>\n<p>Create a login check that asks for a password and prints a different message for correct and incorrect passwords.</p>\n<h3>Challenge 5</h3>\n<p>Create a ticket price program. Ask for the user&#x27;s age and print a child, teenager, adult or senior ticket price.</p>"
  },
  {
    "type": "challenge",
    "number": 6,
    "title": "Challenge 6",
    "url": "challenge6.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for their name and print it in uppercase.</p>\n<h3>Challenge 2</h3>\n<p>Ask for a first name and second name, then print the full name.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user for a word and print the first and last letter.</p>\n<h3>Challenge 4</h3>\n<p>Ask the user for a sentence and print how many characters are in it.</p>\n<h3>Challenge 5</h3>\n<p>Create a username generator that asks for a first name and second name, then creates a username using the first three letters of each name.</p>"
  },
  {
    "type": "challenge",
    "number": 7,
    "title": "Challenge 7",
    "url": "challenge7.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a list of three favourite foods and print it.</p>\n<h3>Challenge 2</h3>\n<p>Print the first and last item in a list.</p>\n<h3>Challenge 3</h3>\n<p>Add a new item to a list, then print the updated list.</p>\n<h3>Challenge 4</h3>\n<p>Remove an item from a list, then change one of the remaining items.</p>\n<h3>Challenge 5</h3>\n<p>Create a shopping list program that starts with three items, adds one item, removes one item and prints the final list.</p>"
  },
  {
    "type": "challenge",
    "number": 8,
    "title": "Challenge 8",
    "url": "challenge8.html",
    "html": "<h3>Challenge 1</h3>\n<p>Use a for loop to print your name five times.</p>\n<h3>Challenge 2</h3>\n<p>Use a for loop to print the numbers from 1 to 10.</p>\n<h3>Challenge 3</h3>\n<p>Create a list of five animals and print each animal using a for loop.</p>\n<h3>Challenge 4</h3>\n<p>Ask the user for a word and use a for loop to print each letter.</p>\n<h3>Challenge 5</h3>\n<p>Create a times table program that asks for a number and prints the first 12 multiples of that number.</p>"
  },
  {
    "type": "challenge",
    "number": 9,
    "title": "Challenge 9",
    "url": "challenge9.html",
    "html": "<h3>Challenge 1</h3>\n<p>Use a while loop to print the numbers from 1 to 5.</p>\n<h3>Challenge 2</h3>\n<p>Use a while loop to count down from 10 to 1.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user to keep typing a password until they type the correct one.</p>\n<h3>Challenge 4</h3>\n<p>Create a guessing game where the user keeps guessing until they choose the correct number.</p>\n<h3>Challenge 5</h3>\n<p>Create a menu that keeps asking the user to choose an option until they choose Quit.</p>"
  },
  {
    "type": "challenge",
    "number": 10,
    "title": "Challenge 10",
    "url": "challenge10.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask if the user is old enough to drive. If they are, ask if they have a licence.</p>\n<h3>Challenge 2</h3>\n<p>Ask for a username. If it is correct, ask for a password.</p>\n<h3>Challenge 3</h3>\n<p>Ask if the user has a ticket. If they do, ask if they are over 18.</p>\n<h3>Challenge 4</h3>\n<p>Create a game door check. The player can enter only if they have a key and enough health.</p>\n<h3>Challenge 5</h3>\n<p>Create a school trip checker that checks permission, payment and age using nested if statements.</p>"
  },
  {
    "type": "challenge",
    "number": 11,
    "title": "Challenge 11",
    "url": "challenge11.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a dictionary for a student with name, age and year.</p>\n<h3>Challenge 2</h3>\n<p>Print one value from your dictionary.</p>\n<h3>Challenge 3</h3>\n<p>Change one value in the dictionary and print the updated dictionary.</p>\n<h3>Challenge 4</h3>\n<p>Add a new key called favourite_subject to the dictionary.</p>\n<h3>Challenge 5</h3>\n<p>Create a dictionary for a game character, then update the character&#x27;s health and score after an event.</p>"
  },
  {
    "type": "challenge",
    "number": 12,
    "title": "Challenge 12",
    "url": "challenge12.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for a number and use try except when converting it to an integer.</p>\n<h3>Challenge 2</h3>\n<p>Ask the user for their age and print a friendly error message if they do not type a number.</p>\n<h3>Challenge 3</h3>\n<p>Ask for two numbers and divide them. Handle bad inputs.</p>\n<h3>Challenge 4</h3>\n<p>Improve the division program so it also handles dividing by zero.</p>\n<h3>Challenge 5</h3>\n<p>Create a safe calculator that lets the user choose an operation and handles invalid numbers without crashing.</p>"
  },
  {
    "type": "challenge",
    "number": 13,
    "title": "Challenge 13",
    "url": "challenge13.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a function that prints Hello.</p>\n<h3>Challenge 2</h3>\n<p>Create a function that takes a name and prints a greeting.</p>\n<h3>Challenge 3</h3>\n<p>Create a function that takes two numbers and returns their total.</p>\n<h3>Challenge 4</h3>\n<p>Create a function that checks if a number is even or odd.</p>\n<h3>Challenge 5</h3>\n<p>Create a small calculator using functions for add, subtract, multiply and divide.</p>"
  },
  {
    "type": "challenge",
    "number": 14,
    "title": "Challenge 14",
    "url": "challenge14.html",
    "html": "<h3>Challenge 1</h3>\n<p>Use a ternary expression to print Adult or Child based on an age variable.</p>\n<h3>Challenge 2</h3>\n<p>Use a ternary expression to print Pass or Fail based on a score.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user for a number and use a ternary expression to say if it is positive or not positive.</p>\n<h3>Challenge 4</h3>\n<p>Use a ternary expression to choose a delivery cost based on whether the order total is over 50.</p>\n<h3>Challenge 5</h3>\n<p>Rewrite three of your older if else programs using ternary expressions, then choose which version is easier to read.</p>"
  },
  {
    "type": "challenge",
    "number": 15,
    "title": "Challenge 15",
    "url": "challenge15.html",
    "html": "<h3>Challenge 1</h3>\n<p>Use nested loops to print a 3 by 3 square of stars.</p>\n<h3>Challenge 2</h3>\n<p>Use nested loops to print a 5 by 5 square of stars.</p>\n<h3>Challenge 3</h3>\n<p>Use nested loops to print every pair of numbers from 1 to 4.</p>\n<h3>Challenge 4</h3>\n<p>Print a triangle of stars that gets bigger on each line.</p>\n<h3>Challenge 5</h3>\n<p>Create a multiplication grid from 1 to 10 using nested loops.</p>"
  },
  {
    "type": "challenge",
    "number": 16,
    "title": "Challenge 16",
    "url": "challenge16.html",
    "html": "<h3>Challenge 1</h3>\n<p>Ask the user for a day of the week and print whether it is a school day or weekend.</p>\n<h3>Challenge 2</h3>\n<p>Create a menu with options 1, 2 and 3 using match case.</p>\n<h3>Challenge 3</h3>\n<p>Ask the user for a grade letter and print a message for A, B, C, D or F.</p>\n<h3>Challenge 4</h3>\n<p>Create a calculator menu where the user chooses add, subtract, multiply or divide.</p>\n<h3>Challenge 5</h3>\n<p>Create a text adventure choice system using match case with at least four different choices and a default case.</p>"
  },
  {
    "type": "challenge",
    "number": 17,
    "title": "Challenge 17",
    "url": "challenge17.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create variables for your name, age and height using type hints.</p>\n<h3>Challenge 2</h3>\n<p>Create a function with type hints that adds two integers.</p>\n<h3>Challenge 3</h3>\n<p>Create a function with type hints that takes a name and returns a greeting.</p>\n<h3>Challenge 4</h3>\n<p>Add type hints to an older calculator program.</p>\n<h3>Challenge 5</h3>\n<p>Create a small set of typed functions for a game: damage_player, heal_player and add_score.</p>"
  },
  {
    "type": "challenge",
    "number": 18,
    "title": "Challenge 18",
    "url": "challenge18.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a class called Student with a name.</p>\n<h3>Challenge 2</h3>\n<p>Create a Student object and print its name.</p>\n<h3>Challenge 3</h3>\n<p>Add age and year attributes to the Student class.</p>\n<h3>Challenge 4</h3>\n<p>Add a method that prints a short introduction for the student.</p>\n<h3>Challenge 5</h3>\n<p>Create a Car class with make, model and speed. Add methods to speed up and slow down the car.</p>"
  },
  {
    "type": "challenge",
    "number": 19,
    "title": "Challenge 19",
    "url": "challenge19.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a Player class with name and health.</p>\n<h3>Challenge 2</h3>\n<p>Create two Player objects and print their names.</p>\n<h3>Challenge 3</h3>\n<p>Add a take_damage method that lowers a player&#x27;s health.</p>\n<h3>Challenge 4</h3>\n<p>Add a heal method and make sure health changes only for the player that used it.</p>\n<h3>Challenge 5</h3>\n<p>Create a simple battle system where two players take turns damaging each other until one player&#x27;s health reaches 0.</p>"
  },
  {
    "type": "challenge",
    "number": 20,
    "title": "Challenge 20",
    "url": "challenge20.html",
    "html": "<h3>Challenge 1</h3>\n<p>Create a recursive function that counts down from 5.</p>\n<h3>Challenge 2</h3>\n<p>Create a recursive function that counts down from a number chosen by the user.</p>\n<h3>Challenge 3</h3>\n<p>Create a recursive function that adds all numbers from 1 to a chosen number.</p>\n<h3>Challenge 4</h3>\n<p>Create a recursive function that calculates factorial.</p>\n<h3>Challenge 5</h3>\n<p>Create a recursive function that prints each letter in a word one at a time.</p>"
  },
  {
    "type": "challenge",
    "number": 21,
    "title": "Challenge 21",
    "url": "challenge21.html",
    "html": "<h3>Challenge 1</h3>\n<p>Search a list of names for a name entered by the user.</p>\n<h3>Challenge 2</h3>\n<p>Find the largest and smallest numbers in a list without using max() or min().</p>\n<h3>Challenge 3</h3>\n<p>Count how many times each word appears in a list.</p>\n<h3>Challenge 4</h3>\n<p>Ask the user for five numbers, store them in a list and find the average.</p>\n<h3>Challenge 5</h3>\n<p>Create a high score program that stores player names and scores in a dictionary, then prints the player with the highest score.</p>"
  }
];

(() => {
  const tutorialHtml = {
    1: `<h2>Print statements</h2>
<p><strong>Definition:</strong> The <code>print()</code> function displays text, numbers, or other values in the terminal.</p>
<p>Printing is useful because it lets a program communicate with the user and lets you check what your code is doing while you build it.</p>
<h3>Syntax</h3>
<pre><code>print(value)</code></pre>
<p>The value goes inside the brackets. Text must go inside quotation marks. Numbers can be printed without quotation marks.</p>
<h3>Example</h3>
<pre><code>print("Hello, World!")
print(42)
print("Answer =", 6 + 4)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Hello, World!
&gt;&gt;&gt; 42
&gt;&gt;&gt; Answer = 10</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Python is case-sensitive, so <code>print</code> works but <code>Print</code> does not.</li>
  <li>Forgetting quotation marks around text causes an error because Python thinks the word is a variable name.</li>
  <li>A comment starts with <code>#</code>. Python ignores comments when it runs the code.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Print your name.</li>
  <li>Print your age as a number.</li>
  <li>Print a short menu on three separate lines.</li>
  <li>Add a comment above one print statement explaining what it does.</li>
</ul>`,
    2: `<h2>Variables</h2>
<p><strong>Definition:</strong> A variable is a name that stores a value so the program can use it later.</p>
<p>Variables are useful because they let you remember information, change it, and reuse it without typing the same value again and again.</p>
<h3>Syntax</h3>
<pre><code>variable_name = value</code></pre>
<p>The equals sign is the assignment operator. It puts the value on the right into the variable name on the left.</p>
<h3>Example</h3>
<pre><code>name = "Harry"
age = 16
is_student = True

print(name)
print(age)
print(is_student)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry
&gt;&gt;&gt; 16
&gt;&gt;&gt; True</code></pre>
<h3>Main data types</h3>
<ul>
  <li><strong>String:</strong> text inside quotes, such as <code>"hello"</code>.</li>
  <li><strong>Integer:</strong> a whole number, such as <code>16</code>.</li>
  <li><strong>Float:</strong> a decimal number, such as <code>16.5</code>.</li>
  <li><strong>Boolean:</strong> either <code>True</code> or <code>False</code>.</li>
</ul>
<h3>Checking a type</h3>
<pre><code>score = 10
print(type(score))</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; &lt;class 'int'&gt;</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Variable names are case-sensitive. <code>age</code> and <code>Age</code> are different names.</li>
  <li>Use clear names such as <code>first_name</code> instead of unclear names such as <code>x</code>.</li>
  <li>A variable can be given a new value later in the program.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create variables for your name, age, and favourite subject.</li>
  <li>Print each variable.</li>
  <li>Change one variable and print it again.</li>
  <li>Use <code>type()</code> to check the type of three different variables.</li>
</ul>`,
    3: `<h2>Input()</h2>
<p><strong>Definition:</strong> The <code>input()</code> function pauses the program and lets the user type a value.</p>
<p>Input is useful because it lets a program react to the person using it instead of always doing the same thing.</p>
<h3>Syntax</h3>
<pre><code>answer = input("Prompt text: ")</code></pre>
<p>The text inside the brackets is the prompt. The value the user types is stored in the variable.</p>
<h3>Example</h3>
<pre><code>name = input("Enter your name: ")
print("Hello", name)</code></pre>
<p>If the user types Harry, it will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Enter your name: Harry
&gt;&gt;&gt; Hello Harry</code></pre>
<h3>Input is always a string</h3>
<p><code>input()</code> always gives back a string, even if the user types digits.</p>
<pre><code>age = input("Enter your age: ")
print(type(age))</code></pre>
<p>If the user types 16, it will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; &lt;class 'str'&gt;</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Use a clear prompt so the user knows what to type.</li>
  <li>Convert the input if you want to do maths with it.</li>
  <li>Store the input in a variable if you need to use it later.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for the user's name and greet them.</li>
  <li>Ask for a favourite colour and print a sentence using it.</li>
  <li>Ask for two pieces of information and print them together.</li>
  <li>Ask for an age and print the type before converting it.</li>
</ul>`,
    4: `<h2>Type conversion</h2>
<p><strong>Definition:</strong> Type conversion, or casting, changes a value from one data type into another.</p>
<p>Casting is useful when a value arrives as text but your program needs a number, or when you want to combine numbers with strings in output.</p>
<h3>Common conversion functions</h3>
<ul>
  <li><code>int()</code> converts to an integer.</li>
  <li><code>float()</code> converts to a decimal number.</li>
  <li><code>str()</code> converts to a string.</li>
  <li><code>bool()</code> converts to a boolean.</li>
</ul>
<h3>Example</h3>
<pre><code>age_text = input("Enter your age: ")
age = int(age_text)
print(age + 1)</code></pre>
<p>If the user types 16, it will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 17</code></pre>
<h3>Strings and numbers behave differently</h3>
<pre><code>print("2" + "2")
print(2 + 2)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 22
&gt;&gt;&gt; 4</code></pre>
<h3>Arithmetic operators</h3>
<ul>
  <li><code>+</code> addition</li>
  <li><code>-</code> subtraction</li>
  <li><code>*</code> multiplication</li>
  <li><code>/</code> division</li>
  <li><code>//</code> whole-number division</li>
  <li><code>%</code> remainder</li>
</ul>
<h3>Important notes</h3>
<ul>
  <li><code>int("hello")</code> causes an error because hello is not a number.</li>
  <li><code>int(5.9)</code> becomes <code>5</code>; it does not round up.</li>
  <li>Convert input before doing arithmetic with it.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for two numbers, convert them, and print their total.</li>
  <li>Print the type of a value before and after converting it.</li>
  <li>Create a simple area calculator for a rectangle.</li>
  <li>Try converting invalid input and read the error message.</li>
</ul>`,
    5: `<h2>If, elif and else statements</h2>
<p><strong>Definition:</strong> A conditional statement lets a program choose which code to run based on whether a condition is true or false.</p>
<p>Conditionals are useful because programs often need to make decisions, such as checking a password, choosing a message, or testing a score.</p>
<h3>Boolean expressions</h3>
<p>A Boolean expression is a question that evaluates to <code>True</code> or <code>False</code>.</p>
<pre><code>print(10 &gt; 5)
print(10 == 5)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; True
&gt;&gt;&gt; False</code></pre>
<h3>Comparison operators</h3>
<ul>
  <li><code>==</code> equal to</li>
  <li><code>!=</code> not equal to</li>
  <li><code>&gt;</code> greater than</li>
  <li><code>&lt;</code> less than</li>
  <li><code>&gt;=</code> greater than or equal to</li>
  <li><code>&lt;=</code> less than or equal to</li>
</ul>
<h3>Example</h3>
<pre><code>mark = 65

if mark &gt;= 80:
    print("Distinction")
elif mark &gt;= 50:
    print("Pass")
else:
    print("Fail")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Pass</code></pre>
<h3>Rules</h3>
<ul>
  <li>Use a colon after <code>if</code>, <code>elif</code>, and <code>else</code>.</li>
  <li>Indent the code that belongs inside each branch.</li>
  <li>Use <code>==</code> to compare values. A single <code>=</code> is for assignment.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for an age and check if the user is old enough to drive.</li>
  <li>Check whether a number is positive, negative, or zero.</li>
  <li>Create a simple password check.</li>
  <li>Predict the output before running each test.</li>
</ul>`,
    6: `<h2>String manipulation</h2>
<p><strong>Definition:</strong> String manipulation means creating, joining, measuring, changing, and reading parts of text.</p>
<p>Strings are useful because programs often work with names, messages, passwords, menu choices, and other text entered by users.</p>
<h3>Joining strings</h3>
<pre><code>first_name = "Harry"
second_name = "Murphy"
print(first_name + " " + second_name)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry Murphy</code></pre>
<h3>F-strings</h3>
<p>An f-string lets you place variables inside a string using braces.</p>
<pre><code>name = "Harry"
age = 16
print(f"{name} is {age} years old")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry is 16 years old</code></pre>
<h3>Length, indexing and slicing</h3>
<p><code>len()</code> counts characters. Indexing gets one character. Slicing gets part of a string.</p>
<pre><code>word = "Python"
print(len(word))
print(word[0])
print(word[1:4])</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 6
&gt;&gt;&gt; P
&gt;&gt;&gt; yth</code></pre>
<h3>Useful string methods</h3>
<pre><code>message = "hello"
print(message.upper())
print(message.capitalize())</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; HELLO
&gt;&gt;&gt; Hello</code></pre>
<h3>Important notes</h3>
<ul>
  <li>String indexes start at 0.</li>
  <li>An index that is too large causes an error.</li>
  <li>Methods such as <code>.upper()</code> return a changed copy of the string.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for a first name and second name, then print a full name.</li>
  <li>Use an f-string to print a sentence with two variables.</li>
  <li>Print the first and last letter of a word.</li>
  <li>Ask for a sentence and print how many characters it contains.</li>
</ul>`,
    7: `<h2>List manipulation</h2>
<p><strong>Definition:</strong> A list is an ordered collection that stores multiple values in one variable.</p>
<p>Lists are useful when one variable is not enough, such as storing several scores, names, menu options, or items in a shopping list.</p>
<h3>List syntax</h3>
<pre><code>names = ["Harry", "Sarah", "John"]
scores = [8, 10, 6]
mixed = ["Python", 3, True]</code></pre>
<p>Lists use square brackets. Items are separated by commas.</p>
<h3>Indexing and length</h3>
<p>Lists are ordered, and their indexes start at 0.</p>
<pre><code>names = ["Harry", "Sarah", "John"]
print(names[0])
print(names[2])
print(len(names))</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry
&gt;&gt;&gt; John
&gt;&gt;&gt; 3</code></pre>
<h3>Changing a list</h3>
<pre><code>numbers = [1, 2, 3]
numbers.append(4)
numbers.remove(2)
numbers[0] = 10
print(numbers)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; [10, 3, 4]</code></pre>
<h3>Checking and looping</h3>
<pre><code>subjects = ["English", "Maths", "Computer Science"]

if "Maths" in subjects:
    print("Maths is in the list")

for subject in subjects:
    print(subject)</code></pre>
<h3>Important notes</h3>
<ul>
  <li><code>append()</code> adds an item to the end of a list.</li>
  <li><code>remove()</code> removes the first matching item and errors if the item is not there.</li>
  <li>Use <code>in</code> to check whether an item exists before removing or using it.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create a list of five favourite foods.</li>
  <li>Print the first item, last item, and length of the list.</li>
  <li>Add, remove, and change one item.</li>
  <li>Loop through the list and print each item in a sentence.</li>
</ul>`,
    8: `<h2>For loops</h2>
<p><strong>Definition:</strong> A <code>for</code> loop repeats code once for each item in a sequence.</p>
<p>For loops are useful when you know the group of items you want to work through, such as a list of names or a range of numbers.</p>
<h3>Looping through a list</h3>
<pre><code>names = ["Harry", "Sarah", "John"]

for name in names:
    print(name)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry
&gt;&gt;&gt; Sarah
&gt;&gt;&gt; John</code></pre>
<h3>Using range()</h3>
<p><code>range()</code> creates a sequence of numbers for the loop to use.</p>
<pre><code>for number in range(5):
    print(number)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 0
&gt;&gt;&gt; 1
&gt;&gt;&gt; 2
&gt;&gt;&gt; 3
&gt;&gt;&gt; 4</code></pre>
<h3>Counting from a different start</h3>
<pre><code>for number in range(1, 6):
    print(number)</code></pre>
<p>This prints 1 to 5. The stop value is not included.</p>
<h3>Important notes</h3>
<ul>
  <li>The loop variable, such as <code>name</code>, changes each time the loop repeats.</li>
  <li>The indented code is the code that repeats.</li>
  <li><code>range(5)</code> starts at 0 and stops before 5.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Print your name five times using <code>range()</code>.</li>
  <li>Print the numbers 1 to 10.</li>
  <li>Create a list of subjects and print each one.</li>
  <li>Make a times table for a number chosen by the user.</li>
</ul>`,
    9: `<h2>While loops</h2>
<p><strong>Definition:</strong> A <code>while</code> loop repeats code while a condition is true.</p>
<p>While loops are useful when you do not know exactly how many times the code should repeat, such as asking until a password is correct.</p>
<h3>Example</h3>
<pre><code>counter = 1

while counter &lt;= 5:
    print(counter)
    counter = counter + 1</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 1
&gt;&gt;&gt; 2
&gt;&gt;&gt; 3
&gt;&gt;&gt; 4
&gt;&gt;&gt; 5</code></pre>
<h3>Password loop</h3>
<pre><code>password = ""

while password != "python":
    password = input("Enter the password: ")

print("Access granted")</code></pre>
<h3>Using break</h3>
<p><code>break</code> stops a loop immediately. It is often used in menu or play-again loops.</p>
<pre><code>while True:
    choice = input("Type q to quit: ")
    if choice == "q":
        break
    print("You typed", choice)</code></pre>
<h3>Important notes</h3>
<ul>
  <li>A while loop must have a condition that can eventually become false, or it may never stop.</li>
  <li>Update a counter inside the loop when counting.</li>
  <li>Use <code>break</code> carefully so it is clear why the loop stops.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Count from 1 to 10 using a while loop.</li>
  <li>Make a countdown from 5 to 1.</li>
  <li>Ask the user to keep entering a password until it is correct.</li>
  <li>Create a small menu that repeats until the user chooses quit.</li>
</ul>`,
    10: `<h2>Nested if statements</h2>
<p><strong>Definition:</strong> A nested <code>if</code> statement is an <code>if</code> statement inside another <code>if</code> statement.</p>
<p>Nested decisions are useful when one question only matters after another condition is already true.</p>
<h3>Example</h3>
<pre><code>age = 18
has_ticket = True

if age &gt;= 18:
    if has_ticket:
        print("You can enter")
    else:
        print("You need a ticket")
else:
    print("You are too young")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; You can enter</code></pre>
<h3>Reading nested logic</h3>
<p>The inner <code>if</code> only runs if the outer <code>if</code> condition is true. In the example, the ticket is checked only after the age check passes.</p>
<h3>Important notes</h3>
<ul>
  <li>Indentation shows which branch each line belongs to.</li>
  <li>Nested code can become hard to read if there are too many levels.</li>
  <li>Sometimes <code>and</code> can make a simple nested condition shorter.</li>
</ul>
<h3>Nested if compared with and</h3>
<pre><code>if age &gt;= 18 and has_ticket:
    print("You can enter")</code></pre>
<p>This is shorter, but nested <code>if</code> statements are useful when each step needs its own message.</p>
<h3>Try it yourself</h3>
<ul>
  <li>Check if someone is old enough to drive, then check if they have a licence.</li>
  <li>Ask for a username, then ask for a password only if the username is correct.</li>
  <li>Create a weather program that asks if it is raining, then asks if it is windy.</li>
  <li>Change indentation in a copy of the example and observe the error or changed behaviour.</li>
</ul>`,
    11: `<h2>Dictionaries</h2>
<p><strong>Definition:</strong> A dictionary stores data as key-value pairs.</p>
<p>Dictionaries are useful when each value needs a label, such as a student's name, age, and year group.</p>
<h3>Syntax</h3>
<pre><code>student = {
    "name": "Harry",
    "age": 16,
    "year": 5
}</code></pre>
<p>The key is on the left of the colon. The value is on the right.</p>
<h3>Reading values</h3>
<pre><code>student = {
    "name": "Harry",
    "age": 16,
    "year": 5
}

print(student["name"])</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry</code></pre>
<h3>Changing and adding values</h3>
<pre><code>student["age"] = 17
student["subject"] = "Computer Science"
print(student)</code></pre>
<p>This changes the age and adds a new key called <code>subject</code>.</p>
<h3>Important notes</h3>
<ul>
  <li>Keys must be unique. If you reuse a key, the old value is replaced.</li>
  <li>Looking up a key that does not exist causes a <code>KeyError</code>.</li>
  <li>Use clear key names so the dictionary is easy to understand.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create a dictionary about yourself with name, age, and favourite subject.</li>
  <li>Print one value using its key.</li>
  <li>Change one value and add one new key-value pair.</li>
  <li>Use <code>in</code> to check whether a key exists before printing it.</li>
</ul>`,
    12: `<h2>Try except</h2>
<p><strong>Definition:</strong> <code>try except</code> is used to handle errors so a program can respond instead of crashing.</p>
<p>Error handling is useful because user input can be unpredictable. A user might type text when your program expects a number.</p>
<h3>Syntax</h3>
<pre><code>try:
    code_that_might_fail()
except:
    code_to_run_if_it_fails()</code></pre>
<h3>Example</h3>
<pre><code>number = input("Enter a number: ")

try:
    number = int(number)
    print(number + 10)
except:
    print("That was not a number")</code></pre>
<p>If the user types 5, it will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 15</code></pre>
<p>If the user types hello, it will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; That was not a number</code></pre>
<h3>Handling a specific error</h3>
<pre><code>try:
    age = int(input("Age: "))
except ValueError:
    print("Please type digits only")</code></pre>
<p>Using a specific exception makes it clearer which problem you are handling.</p>
<h3>Important notes</h3>
<ul>
  <li>Only put code that might fail inside the <code>try</code> block.</li>
  <li>A broad <code>except</code> catches every error, which can hide mistakes while debugging.</li>
  <li>Use helpful error messages that tell the user what to fix.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for an age and handle invalid number input.</li>
  <li>Make a division program that handles bad inputs.</li>
  <li>Add a separate message for division by zero.</li>
  <li>Improve an older calculator so it does not crash on invalid numbers.</li>
</ul>`,
    13: `<h2>Functions</h2>
<p><strong>Definition:</strong> A function is a named, reusable block of code.</p>
<p>Functions are useful because they reduce repetition, organise programs, and make code easier to test and understand.</p>
<h3>Creating and calling a function</h3>
<pre><code>def say_hello():
    print("Hello")

say_hello()</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Hello</code></pre>
<h3>Parameters</h3>
<p>A parameter is a variable that receives a value when the function is called.</p>
<pre><code>def greet(name):
    print("Hello", name)

greet("Harry")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Hello Harry</code></pre>
<h3>Return values</h3>
<p><code>return</code> sends a value back to the place where the function was called.</p>
<pre><code>def add(number1, number2):
    return number1 + number2

result = add(3, 4)
print(result)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 7</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Define a function with <code>def</code>, a name, brackets, and a colon.</li>
  <li>The function body must be indented.</li>
  <li><code>print</code> displays a value; <code>return</code> gives a value back to the program.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create a function that prints your name.</li>
  <li>Create a function that takes a name and greets the person.</li>
  <li>Create a function that returns the total of two numbers.</li>
  <li>Call the same function more than once with different values.</li>
</ul>`,
    14: `<h2>Ternary expressions</h2>
<p><strong>Definition:</strong> A ternary expression is a one-line expression that chooses between two values.</p>
<p>Ternary expressions are useful for short decisions, such as choosing a label or message. They should only be used when they stay easy to read.</p>
<h3>Normal if else</h3>
<pre><code>age = 18

if age &gt;= 18:
    message = "Adult"
else:
    message = "Not adult"

print(message)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Adult</code></pre>
<h3>Ternary syntax</h3>
<pre><code>value_if_true if condition else value_if_false</code></pre>
<h3>Same example as a ternary expression</h3>
<pre><code>age = 18
message = "Adult" if age &gt;= 18 else "Not adult"
print(message)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Adult</code></pre>
<h3>Important notes</h3>
<ul>
  <li>A ternary expression chooses a value; it is not a full replacement for every <code>if</code> statement.</li>
  <li>If the condition or results are complicated, use a normal <code>if else</code> block.</li>
  <li>Readability is more important than making code shorter.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Use a ternary expression to choose "Even" or "Odd".</li>
  <li>Use a ternary expression to choose "Pass" or "Fail".</li>
  <li>Rewrite a simple <code>if else</code> from an earlier lesson as a ternary expression.</li>
  <li>Find one example where a normal <code>if else</code> is clearer.</li>
</ul>`,
    15: `<h2>Nested loops</h2>
<p><strong>Definition:</strong> A nested loop is a loop inside another loop.</p>
<p>Nested loops are useful for grid-like problems, such as rows and columns, tables, coordinates, or repeated combinations.</p>
<h3>How nested loops run</h3>
<p>The inner loop runs completely each time the outer loop runs once.</p>
<pre><code>for row in range(3):
    for column in range(3):
        print("Row", row, "Column", column)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Row 0 Column 0
&gt;&gt;&gt; Row 0 Column 1
&gt;&gt;&gt; Row 0 Column 2
&gt;&gt;&gt; Row 1 Column 0
&gt;&gt;&gt; Row 1 Column 1
&gt;&gt;&gt; Row 1 Column 2
&gt;&gt;&gt; Row 2 Column 0
&gt;&gt;&gt; Row 2 Column 1
&gt;&gt;&gt; Row 2 Column 2</code></pre>
<h3>Grid example</h3>
<pre><code>for row in range(3):
    for column in range(3):
        print("*", end="")
    print()</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; ***
&gt;&gt;&gt; ***
&gt;&gt;&gt; ***</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Use different variable names for the outer and inner loops.</li>
  <li>Indent the inner loop inside the outer loop.</li>
  <li><code>print()</code> with no text can move to a new line after a row.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Print a 5 by 5 square of stars.</li>
  <li>Print a triangle of stars.</li>
  <li>Print every pair of numbers from 1 to 3.</li>
  <li>Create a multiplication grid from 1 to 10.</li>
</ul>`,
    16: `<h2>Match case</h2>
<p><strong>Definition:</strong> <code>match case</code> checks one value against several possible patterns and runs the matching branch.</p>
<p>It is useful for menus, commands, and choices where one variable can have several clear options.</p>
<h3>Syntax</h3>
<pre><code>match value:
    case pattern:
        code_to_run
    case _:
        default_code</code></pre>
<p>The underscore case is the default case. It runs when nothing else matches.</p>
<h3>Example</h3>
<pre><code>day = "Monday"

match day:
    case "Monday":
        print("Start of the week")
    case "Friday":
        print("Almost the weekend")
    case "Saturday" | "Sunday":
        print("Weekend")
    case _:
        print("Normal day")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Start of the week</code></pre>
<h3>Important notes</h3>
<ul>
  <li><code>match</code> checks one main value.</li>
  <li>Each <code>case</code> needs a colon and an indented block.</li>
  <li>Use <code>|</code> to match more than one possible value in the same case.</li>
  <li>Use <code>if/elif/else</code> when the conditions are ranges, such as scores or ages.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Ask for a day of the week and print a message.</li>
  <li>Create a menu with options 1, 2, and 3.</li>
  <li>Add a default case for invalid input.</li>
  <li>Rewrite a match case program using <code>if/elif/else</code>.</li>
</ul>`,
    17: `<h2>Static typing</h2>
<p><strong>Definition:</strong> Static typing means knowing the expected type of a value before the program runs. Python normally uses dynamic typing, but it supports type hints.</p>
<p>Type hints are useful because they make code easier to read, help editors give better advice, and help programmers find mistakes earlier.</p>
<h3>Variable type hints</h3>
<pre><code>name: str = "Harry"
age: int = 16
height: float = 1.75
is_student: bool = True</code></pre>
<p>The type hint goes after the variable name and a colon.</p>
<h3>Function type hints</h3>
<pre><code>def add(number1: int, number2: int) -&gt; int:
    return number1 + number2

print(add(3, 4))</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 7</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Type hints do not usually stop Python from running by themselves.</li>
  <li><code>age: int = "sixteen"</code> can still run, but the hint says the value should be an integer.</li>
  <li>The arrow <code>-&gt;</code> shows the type a function should return.</li>
  <li>Type hints are most helpful when functions have parameters and return values.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Add type hints to variables for your name, age, and favourite subject.</li>
  <li>Add type hints to a function that multiplies two integers.</li>
  <li>Create a function that takes a string and returns a greeting string.</li>
  <li>Try putting the wrong type into a hinted variable and explain what happens.</li>
</ul>`,
    18: `<h2>Classes</h2>
<p><strong>Definition:</strong> A class is a blueprint for creating objects.</p>
<p>Classes are useful when you want to group related data and functions together, such as a student with a name and age, or a car with speed and methods.</p>
<h3>Objects and attributes</h3>
<p>An object is one thing created from a class. An attribute is data stored inside that object.</p>
<pre><code>class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age

student1 = Student("Harry", 16)

print(student1.name)
print(student1.age)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Harry
&gt;&gt;&gt; 16</code></pre>
<h3>Methods</h3>
<p>A method is a function that belongs to a class.</p>
<pre><code>class Student:
    def __init__(self, name):
        self.name = name

    def say_hello(self):
        print("Hello, my name is " + self.name)

student1 = Student("Harry")
student1.say_hello()</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Hello, my name is Harry</code></pre>
<h3>Important notes</h3>
<ul>
  <li><code>__init__</code> runs when a new object is created.</li>
  <li><code>self</code> means the current object.</li>
  <li>Attributes are accessed with dot notation, such as <code>student1.name</code>.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create a class called <code>Dog</code> with a name and age.</li>
  <li>Create two objects from the same class.</li>
  <li>Add a method that prints a sentence about the object.</li>
  <li>Try printing an attribute that does not exist and read the error.</li>
</ul>`,
    19: `<h2>OOP</h2>
<p><strong>Definition:</strong> OOP means Object-Oriented Programming. It is a way of organising code using classes and objects.</p>
<p>OOP is useful because it keeps related data and behaviour together. This makes larger programs easier to organise.</p>
<h3>State and behaviour</h3>
<p>An object's data is its state. The functions it can run are its behaviour.</p>
<pre><code>class Player:
    def __init__(self, name):
        self.name = name
        self.health = 100
        self.score = 0

    def take_damage(self, amount):
        self.health = self.health - amount

    def add_score(self, points):
        self.score = self.score + points

player1 = Player("Harry")
player1.take_damage(20)
player1.add_score(10)

print(player1.health)
print(player1.score)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 80
&gt;&gt;&gt; 10</code></pre>
<h3>Objects are separate</h3>
<pre><code>player1 = Player("Harry")
player2 = Player("Sarah")

player1.add_score(10)

print(player1.score)
print(player2.score)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 10
&gt;&gt;&gt; 0</code></pre>
<h3>Important notes</h3>
<ul>
  <li>A class describes what objects should have and do.</li>
  <li>Each object has its own copy of the attributes.</li>
  <li>Methods are used to change or use an object's data safely.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Create a <code>Player</code> class with name, health, and score.</li>
  <li>Add methods to change health and score.</li>
  <li>Create two different players.</li>
  <li>Show that changing one player does not change the other player.</li>
</ul>`,
    20: `<h2>Recursion</h2>
<p><strong>Definition:</strong> Recursion is when a function calls itself.</p>
<p>Recursion is useful for problems that can be broken into smaller versions of the same problem, such as countdowns, factorials, and some searching tasks.</p>
<h3>The two required parts</h3>
<ul>
  <li><strong>Base case:</strong> the condition that stops the recursion.</li>
  <li><strong>Recursive case:</strong> the part where the function calls itself with a smaller or simpler value.</li>
</ul>
<h3>Countdown example</h3>
<pre><code>def countdown(number):
    print(number)

    if number &gt; 1:
        countdown(number - 1)

countdown(5)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 5
&gt;&gt;&gt; 4
&gt;&gt;&gt; 3
&gt;&gt;&gt; 2
&gt;&gt;&gt; 1</code></pre>
<h3>Factorial example</h3>
<p>Factorial means multiplying a number by every whole number below it down to 1.</p>
<pre><code>def factorial(number):
    if number == 1:
        return 1
    return number * factorial(number - 1)

print(factorial(5))</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 120</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Without a base case, recursion may continue until Python stops with an error.</li>
  <li>Each recursive call should move closer to the base case.</li>
  <li>Some problems are clearer with loops; recursion is not always the best choice.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Make a recursive function that counts down from 10.</li>
  <li>Change the countdown so it stops at 0.</li>
  <li>Create a recursive function that adds all numbers from 1 to a chosen number.</li>
  <li>Identify the base case and recursive case in each function.</li>
</ul>`,
    21: `<h2>Advanced data algorithms</h2>
<p><strong>Definition:</strong> An algorithm is a clear set of steps used to solve a problem.</p>
<p>Data algorithms are useful because programs often need to search, count, compare, sort, or summarise information stored in lists and dictionaries.</p>
<h3>Searching a list</h3>
<p>Searching means checking data to find a target value.</p>
<pre><code>names = ["Harry", "Sarah", "John"]
target = "Sarah"

for name in names:
    if name == target:
        print("Found")</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; Found</code></pre>
<h3>Finding the largest number</h3>
<pre><code>numbers = [4, 9, 2, 7]
largest = numbers[0]

for number in numbers:
    if number &gt; largest:
        largest = number

print(largest)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; 9</code></pre>
<h3>Counting with a dictionary</h3>
<pre><code>words = ["red", "blue", "red", "green", "blue", "red"]
counts = {}

for word in words:
    if word in counts:
        counts[word] = counts[word] + 1
    else:
        counts[word] = 1

print(counts)</code></pre>
<p>will display:</p>
<pre class="terminal-output"><code>&gt;&gt;&gt; {'red': 3, 'blue': 2, 'green': 1}</code></pre>
<h3>Important notes</h3>
<ul>
  <li>Start with a clear problem before writing code.</li>
  <li>Trace the algorithm with a small list to check the logic.</li>
  <li>Python has built-in tools such as <code>max()</code>, <code>min()</code>, and <code>sorted()</code>, but writing the steps yourself helps you understand how algorithms work.</li>
</ul>
<h3>Try it yourself</h3>
<ul>
  <li>Search a list for a name entered by the user.</li>
  <li>Find the smallest number in a list without using <code>min()</code>.</li>
  <li>Count how many times each letter appears in a word.</li>
  <li>Sort a list using <code>sorted()</code> and compare it with your own search code.</li>
</ul>`
  };

  window.COURSE_DATA = window.COURSE_DATA.map((entry) =>
    entry.type === "tutorial" && tutorialHtml[entry.number]
      ? { ...entry, html: tutorialHtml[entry.number] }
      : entry
  );
})();
