import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ============================================================================
   VOCABULARY GUESS — a premium word-guessing game
   Single-file React component. No external CSS, no external assets.
   Sounds are synthesized with the Web Audio API. Visuals are hand-built
   glassmorphism + CSS animation, matching an App-Store-quality feel.
============================================================================ */

/* ----------------------------------------------------------------------- */
/* WORD BANK — 230+ curated words across 7 categories with real definitions */
/* ----------------------------------------------------------------------- */
const WORD_BANK = [
  // Animals
  { w: "LION", d: "A large wild cat with a mane, known as the king of the jungle", c: "Animals" },
  { w: "TIGER", d: "The largest wild cat, famous for its orange coat and black stripes", c: "Animals" },
  { w: "ZEBRA", d: "An African animal that looks like a horse with black and white stripes", c: "Animals" },
  { w: "GIRAFFE", d: "The tallest land animal, known for its very long neck", c: "Animals" },
  { w: "MONKEY", d: "A playful primate often seen swinging through trees", c: "Animals" },
  { w: "DOLPHIN", d: "A highly intelligent marine mammal known for its playful leaps", c: "Animals" },
  { w: "PENGUIN", d: "A flightless bird that waddles on land and swims in cold seas", c: "Animals" },
  { w: "KANGAROO", d: "An Australian marsupial that hops and carries its young in a pouch", c: "Animals" },
  { w: "CHEETAH", d: "The fastest land animal, built for short bursts of speed", c: "Animals" },
  { w: "LEOPARD", d: "A spotted big cat known for its stealth and climbing skill", c: "Animals" },
  { w: "GORILLA", d: "A powerful great ape that lives in African forests", c: "Animals" },
  { w: "OCTOPUS", d: "A sea creature with eight arms and the ability to change color", c: "Animals" },
  { w: "CROCODILE", d: "A large reptile with powerful jaws that lurks in rivers", c: "Animals" },
  { w: "HEDGEHOG", d: "A small spiny mammal that curls into a ball when threatened", c: "Animals" },
  { w: "RACCOON", d: "A masked, ring-tailed mammal known for raiding trash cans at night", c: "Animals" },
  { w: "SQUIRREL", d: "A small bushy-tailed rodent that loves to bury acorns", c: "Animals" },
  { w: "PEACOCK", d: "A bird famous for its dazzling, fan-shaped tail feathers", c: "Animals" },
  { w: "FLAMINGO", d: "A pink wading bird that often stands on one leg", c: "Animals" },
  { w: "JELLYFISH", d: "A soft, gelatinous sea creature with trailing stinging tentacles", c: "Animals" },
  { w: "CHAMELEON", d: "A lizard famous for changing color to match its surroundings", c: "Animals" },
  { w: "MEERKAT", d: "A small burrowing mammal that stands upright to watch for danger", c: "Animals" },
  { w: "WALRUS", d: "A large Arctic mammal with long tusks and thick whiskers", c: "Animals" },
  { w: "OTTER", d: "A playful, semi-aquatic mammal known for using rocks as tools", c: "Animals" },
  { w: "FALCON", d: "A fast bird of prey known for its incredible diving speed", c: "Animals" },
  { w: "EAGLE", d: "A large bird of prey with sharp talons and keen eyesight", c: "Animals" },
  { w: "OWL", d: "A nocturnal bird known for its silent flight and swiveling head", c: "Animals" },
  { w: "WOLF", d: "A wild canine that hunts in packs and howls at night", c: "Animals" },
  { w: "RABBIT", d: "A long-eared mammal known for hopping and rapid breeding", c: "Animals" },
  { w: "TURTLE", d: "A reptile that carries a protective shell on its back", c: "Animals" },
  { w: "SNAKE", d: "A legless reptile that moves by slithering across the ground", c: "Animals" },
  { w: "SPIDER", d: "An eight-legged creature that spins webs to catch prey", c: "Animals" },
  { w: "SHARK", d: "A powerful ocean predator with rows of sharp teeth", c: "Animals" },
  { w: "WHALE", d: "The largest animal on Earth, living entirely in the ocean", c: "Animals" },
  { w: "HIPPOPOTAMUS", d: "A massive African animal that spends most of its day in water", c: "Animals" },
  { w: "RHINOCEROS", d: "A huge, thick-skinned animal known for the horn on its nose", c: "Animals" },
  { w: "PANDA", d: "A black and white bear that feeds almost entirely on bamboo", c: "Animals" },
  { w: "KOALA", d: "An Australian marsupial that spends most of its life in eucalyptus trees", c: "Animals" },
  { w: "SLOTH", d: "A slow-moving mammal that spends most of its life hanging in trees", c: "Animals" },
  { w: "SCORPION", d: "An arachnid with a venomous stinger curled over its back", c: "Animals" },
  { w: "IGUANA", d: "A large, spiny-backed lizard often kept as an exotic pet", c: "Animals" },
  { w: "OSTRICH", d: "The largest living bird, unable to fly but a fast runner", c: "Animals" },

  // Food
  { w: "PIZZA", d: "A baked dish of flat dough topped with cheese and sauce", c: "Food" },
  { w: "BURGER", d: "A patty of meat served inside a round bun", c: "Food" },
  { w: "PASTA", d: "An Italian food made from dough, often shaped into noodles", c: "Food" },
  { w: "SALAD", d: "A dish of mixed raw vegetables, often served cold", c: "Food" },
  { w: "SANDWICH", d: "Two slices of bread with a filling in between", c: "Food" },
  { w: "PANCAKE", d: "A flat, round cake cooked on a griddle and often topped with syrup", c: "Food" },
  { w: "WAFFLE", d: "A crisp batter cake cooked in a griddle with a grid pattern", c: "Food" },
  { w: "SUSHI", d: "A Japanese dish of vinegared rice paired with fish or vegetables", c: "Food" },
  { w: "BURRITO", d: "A Mexican dish of a filled tortilla rolled into a cylinder", c: "Food" },
  { w: "NOODLE", d: "A long, thin strip of dough cooked in liquid", c: "Food" },
  { w: "DUMPLING", d: "A small parcel of dough wrapped around a savory filling", c: "Food" },
  { w: "CROISSANT", d: "A flaky, crescent-shaped French pastry", c: "Food" },
  { w: "BAGEL", d: "A dense, ring-shaped bread roll that is boiled then baked", c: "Food" },
  { w: "MUFFIN", d: "A small baked cake, often studded with fruit or chocolate chips", c: "Food" },
  { w: "COOKIE", d: "A small, sweet baked treat, often crisp at the edges", c: "Food" },
  { w: "BROWNIE", d: "A dense, fudgy chocolate square baked in a pan", c: "Food" },
  { w: "LASAGNA", d: "A layered Italian dish of pasta sheets, sauce, and cheese", c: "Food" },
  { w: "RISOTTO", d: "A creamy Italian rice dish slowly cooked with broth", c: "Food" },
  { w: "CURRY", d: "A spiced dish, often with a sauce, common in South Asian cooking", c: "Food" },
  { w: "KEBAB", d: "Pieces of meat grilled or roasted on a skewer", c: "Food" },
  { w: "FALAFEL", d: "A deep-fried ball made from ground chickpeas or fava beans", c: "Food" },
  { w: "HUMMUS", d: "A creamy dip made from mashed chickpeas and tahini", c: "Food" },
  { w: "GUACAMOLE", d: "A creamy dip made primarily from mashed avocado", c: "Food" },
  { w: "CINNAMON", d: "A warm, sweet spice made from tree bark", c: "Food" },
  { w: "SAFFRON", d: "A prized golden spice harvested from crocus flowers", c: "Food" },
  { w: "GARLIC", d: "A pungent bulb used to flavor savory dishes", c: "Food" },
  { w: "POTATO", d: "A starchy root vegetable often boiled, fried, or mashed", c: "Food" },
  { w: "TOMATO", d: "A red, juicy fruit commonly used as a savory vegetable", c: "Food" },
  { w: "BROCCOLI", d: "A green vegetable with tightly packed edible flower buds", c: "Food" },
  { w: "SPINACH", d: "A leafy green vegetable rich in iron", c: "Food" },
  { w: "PUMPKIN", d: "A large orange squash often carved for autumn festivities", c: "Food" },
  { w: "WATERMELON", d: "A large, sweet fruit with a green rind and juicy red flesh", c: "Food" },
  { w: "PINEAPPLE", d: "A tropical fruit with a spiky skin and sweet yellow flesh", c: "Food" },
  { w: "AVOCADO", d: "A creamy green fruit often mashed for dips and toast", c: "Food" },
  { w: "COCONUT", d: "A large tropical fruit with a hard shell and white flesh", c: "Food" },
  { w: "CHOCOLATE", d: "A sweet food made from roasted, ground cacao beans", c: "Food" },
  { w: "CARAMEL", d: "A golden confection made by slowly heating sugar", c: "Food" },
  { w: "VANILLA", d: "A fragrant flavoring made from the pods of an orchid", c: "Food" },
  { w: "HONEY", d: "A sweet, sticky substance made by bees from flower nectar", c: "Food" },
  { w: "YOGURT", d: "A thick, tangy dairy food made by fermenting milk", c: "Food" },

  // Sports
  { w: "FOOTBALL", d: "A team sport played by kicking a ball toward a goal", c: "Sports" },
  { w: "BASKETBALL", d: "A sport where players score by shooting a ball through a hoop", c: "Sports" },
  { w: "BASEBALL", d: "A bat-and-ball sport played between two teams of nine players", c: "Sports" },
  { w: "TENNIS", d: "A racket sport played by hitting a ball over a net", c: "Sports" },
  { w: "CRICKET", d: "A bat-and-ball sport played on a large oval field with wickets", c: "Sports" },
  { w: "HOCKEY", d: "A sport where players use curved sticks to hit a puck or ball", c: "Sports" },
  { w: "RUGBY", d: "A rough contact sport played by carrying an oval ball", c: "Sports" },
  { w: "GOLF", d: "A precision sport where players hit a small ball into holes", c: "Sports" },
  { w: "BOXING", d: "A combat sport in which two people fight using only their fists", c: "Sports" },
  { w: "WRESTLING", d: "A combat sport involving grappling to pin an opponent", c: "Sports" },
  { w: "SWIMMING", d: "A sport of racing through water using the body alone", c: "Sports" },
  { w: "CYCLING", d: "A sport of racing on a two-wheeled pedal-powered vehicle", c: "Sports" },
  { w: "MARATHON", d: "A long-distance running race of just over 26 miles", c: "Sports" },
  { w: "GYMNASTICS", d: "A sport involving acrobatic feats of flexibility and balance", c: "Sports" },
  { w: "ARCHERY", d: "A sport of shooting arrows at a target with a bow", c: "Sports" },
  { w: "FENCING", d: "A sport of sword-fighting with protective gear and blunted blades", c: "Sports" },
  { w: "ROWING", d: "A sport of propelling a boat using oars", c: "Sports" },
  { w: "SURFING", d: "A sport of riding ocean waves while standing on a board", c: "Sports" },
  { w: "SKATING", d: "A sport of gliding on ice or wheels attached to the feet", c: "Sports" },
  { w: "SKIING", d: "A sport of sliding over snow on two long, narrow boards", c: "Sports" },
  { w: "VOLLEYBALL", d: "A sport where two teams hit a ball over a net without letting it drop", c: "Sports" },
  { w: "BADMINTON", d: "A racket sport played by hitting a feathered shuttlecock", c: "Sports" },
  { w: "BOWLING", d: "A sport of rolling a heavy ball to knock down standing pins", c: "Sports" },
  { w: "DIVING", d: "A sport of jumping into water while performing acrobatic moves", c: "Sports" },
  { w: "KARATE", d: "A Japanese martial art using strikes with hands and feet", c: "Sports" },
  { w: "STADIUM", d: "A large structure with tiered seating used for major sporting events", c: "Sports" },
  { w: "TOURNAMENT", d: "A series of contests played to determine an overall winner", c: "Sports" },
  { w: "ATHLETE", d: "A person who is skilled and trained in physical sports", c: "Sports" },
  { w: "REFEREE", d: "An official who enforces the rules during a sporting match", c: "Sports" },
  { w: "GOALKEEPER", d: "The player positioned to stop the ball from entering the net", c: "Sports" },
  { w: "TROPHY", d: "An object awarded as a symbol of victory in a competition", c: "Sports" },
  { w: "RACKET", d: "A handled frame with strings used to hit a ball or shuttlecock", c: "Sports" },
  { w: "HELMET", d: "Protective headgear worn to prevent injury during a sport", c: "Sports" },
  { w: "WHISTLE", d: "A small instrument blown to signal a stop in play", c: "Sports" },

  // Technology
  { w: "COMPUTER", d: "An electronic device that processes data according to instructions", c: "Technology" },
  { w: "INTERNET", d: "A vast global network that connects computers around the world", c: "Technology" },
  { w: "SOFTWARE", d: "The programs and instructions that run on a computer", c: "Technology" },
  { w: "HARDWARE", d: "The physical parts that make up a computer system", c: "Technology" },
  { w: "KEYBOARD", d: "An input device with buttons used to type text", c: "Technology" },
  { w: "MONITOR", d: "A screen used to display output from a computer", c: "Technology" },
  { w: "PROCESSOR", d: "The chip that carries out a computer's instructions", c: "Technology" },
  { w: "ALGORITHM", d: "A step-by-step set of rules for solving a problem", c: "Technology" },
  { w: "DATABASE", d: "An organized collection of data stored electronically", c: "Technology" },
  { w: "NETWORK", d: "A group of interconnected computers that share resources", c: "Technology" },
  { w: "SERVER", d: "A computer that provides data or services to other computers", c: "Technology" },
  { w: "BROWSER", d: "A program used to access and view websites", c: "Technology" },
  { w: "WEBSITE", d: "A collection of linked pages accessible on the internet", c: "Technology" },
  { w: "PASSWORD", d: "A secret string of characters used to verify identity", c: "Technology" },
  { w: "DOWNLOAD", d: "The act of transferring data from the internet to a device", c: "Technology" },
  { w: "BLUETOOTH", d: "A wireless technology for exchanging data over short distances", c: "Technology" },
  { w: "WIRELESS", d: "Describing technology that transmits data without physical cables", c: "Technology" },
  { w: "SATELLITE", d: "A device orbiting Earth used for communication or navigation", c: "Technology" },
  { w: "ROBOT", d: "A machine capable of carrying out tasks automatically", c: "Technology" },
  { w: "SENSOR", d: "A device that detects and responds to physical input", c: "Technology" },
  { w: "CIRCUIT", d: "A closed path through which electric current can flow", c: "Technology" },
  { w: "BATTERY", d: "A device that stores and supplies electrical energy", c: "Technology" },
  { w: "LAPTOP", d: "A portable, battery-powered personal computer", c: "Technology" },
  { w: "TABLET", d: "A flat, touchscreen portable computer", c: "Technology" },
  { w: "CAMERA", d: "A device used to capture photographs or video", c: "Technology" },
  { w: "PRINTER", d: "A device that produces a paper copy of digital text or images", c: "Technology" },
  { w: "ROUTER", d: "A device that directs data traffic between networks", c: "Technology" },
  { w: "ENCRYPTION", d: "The process of converting data into a secure, unreadable code", c: "Technology" },
  { w: "DEVELOPER", d: "A person who writes and builds computer software", c: "Technology" },
  { w: "INTERFACE", d: "The point where a user interacts with a device or program", c: "Technology" },
  { w: "STREAMING", d: "Playing audio or video continuously from an online source", c: "Technology" },
  { w: "MICROCHIP", d: "A tiny electronic circuit embedded in silicon", c: "Technology" },
  { w: "DIGITAL", d: "Describing information represented as discrete numerical values", c: "Technology" },
  { w: "PIXEL", d: "The smallest single point of color in a digital image", c: "Technology" },
  { w: "CURSOR", d: "The movable indicator that shows position on a screen", c: "Technology" },

  // Geography
  { w: "MOUNTAIN", d: "A large natural landform that rises steeply above its surroundings", c: "Geography" },
  { w: "VALLEY", d: "A low area of land between hills or mountains", c: "Geography" },
  { w: "RIVER", d: "A large natural stream of water flowing toward a sea", c: "Geography" },
  { w: "OCEAN", d: "A vast body of salt water covering most of the Earth", c: "Geography" },
  { w: "DESERT", d: "A dry, barren area of land with very little rainfall", c: "Geography" },
  { w: "ISLAND", d: "A piece of land completely surrounded by water", c: "Geography" },
  { w: "PENINSULA", d: "A piece of land almost surrounded by water, joined to a larger mass", c: "Geography" },
  { w: "CONTINENT", d: "One of the world's main continuous expanses of land", c: "Geography" },
  { w: "VOLCANO", d: "A mountain that can erupt with lava, ash, and gas", c: "Geography" },
  { w: "GLACIER", d: "A massive, slow-moving river of ice", c: "Geography" },
  { w: "CANYON", d: "A deep gorge carved by a river over time", c: "Geography" },
  { w: "PLATEAU", d: "An area of flat, elevated land higher than its surroundings", c: "Geography" },
  { w: "FOREST", d: "A large area densely covered with trees", c: "Geography" },
  { w: "JUNGLE", d: "A dense tropical forest with thick vegetation", c: "Geography" },
  { w: "SAVANNA", d: "A grassy plain with scattered trees found in warm climates", c: "Geography" },
  { w: "TUNDRA", d: "A cold, treeless plain found near the Arctic", c: "Geography" },
  { w: "LAGOON", d: "A shallow body of water separated from the sea by a reef", c: "Geography" },
  { w: "ARCHIPELAGO", d: "A group or chain of islands", c: "Geography" },
  { w: "EQUATOR", d: "An imaginary line circling the Earth midway between the poles", c: "Geography" },
  { w: "HEMISPHERE", d: "Half of the Earth, divided by the equator or a meridian", c: "Geography" },
  { w: "CAPITAL", d: "The city that serves as the seat of a country's government", c: "Geography" },
  { w: "BORDER", d: "The line that divides one country or region from another", c: "Geography" },
  { w: "HARBOR", d: "A sheltered area of water where ships can anchor safely", c: "Geography" },
  { w: "COASTLINE", d: "The outline where land meets the sea", c: "Geography" },
  { w: "WATERFALL", d: "A cascade of water falling from a height", c: "Geography" },
  { w: "PLAIN", d: "A large area of flat land with few trees", c: "Geography" },
  { w: "CLIFF", d: "A steep, high rock face, often along a coast", c: "Geography" },
  { w: "CAVE", d: "A natural underground hollow, often found in rock or hillside", c: "Geography" },
  { w: "REEF", d: "A ridge of rock or coral lying near the water's surface", c: "Geography" },
  { w: "OASIS", d: "A fertile, green spot with water found in a desert", c: "Geography" },
  { w: "STRAIT", d: "A narrow passage of water connecting two larger seas", c: "Geography" },
  { w: "GULF", d: "A large area of sea partly enclosed by land", c: "Geography" },
  { w: "CRATER", d: "A bowl-shaped depression formed by an impact or eruption", c: "Geography" },
  { w: "BASIN", d: "A low-lying area of land surrounded by higher ground", c: "Geography" },
  { w: "VILLAGE", d: "A small community of houses in a rural area", c: "Geography" },

  // Science
  { w: "GRAVITY", d: "The force that pulls objects toward the center of a planet", c: "Science" },
  { w: "ENERGY", d: "The capacity to do work, existing in many forms", c: "Science" },
  { w: "MOLECULE", d: "A group of atoms bonded together, the smallest unit of a compound", c: "Science" },
  { w: "ELECTRON", d: "A tiny particle with a negative charge that orbits an atom's nucleus", c: "Science" },
  { w: "ELEMENT", d: "A pure substance that cannot be broken down chemically", c: "Science" },
  { w: "COMPOUND", d: "A substance formed when two or more elements chemically combine", c: "Science" },
  { w: "REACTION", d: "A process in which substances transform into different substances", c: "Science" },
  { w: "EVOLUTION", d: "The gradual change of species over successive generations", c: "Science" },
  { w: "GENETICS", d: "The branch of science that studies heredity and genes", c: "Science" },
  { w: "BACTERIA", d: "Microscopic single-celled organisms found almost everywhere", c: "Science" },
  { w: "ECOSYSTEM", d: "A community of living things interacting with their environment", c: "Science" },
  { w: "GALAXY", d: "A massive system of stars, gas, and dust bound by gravity", c: "Science" },
  { w: "PLANET", d: "A large celestial body that orbits a star", c: "Science" },
  { w: "ASTEROID", d: "A small rocky body orbiting the sun, mostly found in a belt", c: "Science" },
  { w: "METEOR", d: "A streak of light seen when space debris burns in the atmosphere", c: "Science" },
  { w: "TELESCOPE", d: "An instrument used to observe distant objects in space", c: "Science" },
  { w: "MICROSCOPE", d: "An instrument used to view objects too small to see with the eye", c: "Science" },
  { w: "EXPERIMENT", d: "A scientific test carried out to discover something", c: "Science" },
  { w: "HYPOTHESIS", d: "A proposed explanation made as a starting point for investigation", c: "Science" },
  { w: "LABORATORY", d: "A room or building equipped for scientific experiments", c: "Science" },
  { w: "CHEMISTRY", d: "The scientific study of substances and their reactions", c: "Science" },
  { w: "PHYSICS", d: "The science of matter, energy, and the forces between them", c: "Science" },
  { w: "BIOLOGY", d: "The scientific study of living organisms", c: "Science" },
  { w: "ASTRONOMY", d: "The scientific study of stars, planets, and outer space", c: "Science" },
  { w: "GEOLOGY", d: "The scientific study of the Earth's rocks and structure", c: "Science" },
  { w: "MAGNETISM", d: "The force exerted by magnets that attracts certain metals", c: "Science" },
  { w: "VELOCITY", d: "The speed of something in a given direction", c: "Science" },
  { w: "FRICTION", d: "The resistance one surface encounters when moving over another", c: "Science" },
  { w: "DENSITY", d: "A measure of how much mass is packed into a given volume", c: "Science" },
  { w: "PRESSURE", d: "The force exerted over a given area", c: "Science" },
  { w: "VACCINE", d: "A substance that trains the immune system to fight a disease", c: "Science" },
  { w: "ENZYME", d: "A protein that speeds up chemical reactions in living things", c: "Science" },
  { w: "NEURON", d: "A specialized cell that transmits nerve impulses", c: "Science" },
  { w: "SKELETON", d: "The internal framework of bones that supports the body", c: "Science" },
  { w: "ORGANISM", d: "Any individual living thing, from bacteria to animals", c: "Science" },
  { w: "HABITAT", d: "The natural environment in which an organism lives", c: "Science" },
  { w: "NUCLEUS", d: "The dense central part of an atom or a cell", c: "Science" },

  // Everyday
  { w: "UMBRELLA", d: "A folding device carried to give shelter from rain", c: "Everyday" },
  { w: "BACKPACK", d: "A bag with straps worn on the back for carrying items", c: "Everyday" },
  { w: "CALENDAR", d: "A chart showing the days, weeks, and months of a year", c: "Everyday" },
  { w: "BLANKET", d: "A large piece of soft fabric used for warmth", c: "Everyday" },
  { w: "PILLOW", d: "A soft cushion used to support the head while resting", c: "Everyday" },
  { w: "MIRROR", d: "A surface that reflects a clear image of what faces it", c: "Everyday" },
  { w: "CANDLE", d: "A stick of wax with a wick, burned to give light", c: "Everyday" },
  { w: "SCISSORS", d: "A hand tool with two blades used for cutting", c: "Everyday" },
  { w: "ENVELOPE", d: "A flat paper container used to hold and mail a letter", c: "Everyday" },
  { w: "NOTEBOOK", d: "A book of blank pages used for writing notes", c: "Everyday" },
  { w: "WALLET", d: "A small folding case used to carry money and cards", c: "Everyday" },
  { w: "SUITCASE", d: "A rectangular case used for carrying clothes while traveling", c: "Everyday" },
  { w: "STAIRCASE", d: "A set of steps leading from one floor to another", c: "Everyday" },
  { w: "WINDOW", d: "An opening in a wall fitted with glass to let in light", c: "Everyday" },
  { w: "CURTAIN", d: "A piece of fabric hung to cover a window", c: "Everyday" },
  { w: "CARPET", d: "A thick woven fabric used to cover a floor", c: "Everyday" },
  { w: "FURNITURE", d: "Movable objects like tables and chairs used in a home", c: "Everyday" },
  { w: "KITCHEN", d: "A room where food is prepared and cooked", c: "Everyday" },
  { w: "GARDEN", d: "A piece of ground used for growing plants and flowers", c: "Everyday" },
  { w: "NEIGHBOR", d: "A person who lives near another", c: "Everyday" },
  { w: "FAMILY", d: "A group of people related by blood or marriage", c: "Everyday" },
  { w: "FRIENDSHIP", d: "A close bond of mutual affection between people", c: "Everyday" },
  { w: "HAPPINESS", d: "The state of feeling joyful and content", c: "Everyday" },
  { w: "PATIENCE", d: "The ability to stay calm while waiting or facing difficulty", c: "Everyday" },
  { w: "KINDNESS", d: "The quality of being friendly, generous, and considerate", c: "Everyday" },
  { w: "HONESTY", d: "The quality of being truthful and sincere", c: "Everyday" },
  { w: "COURAGE", d: "The ability to face fear or danger with confidence", c: "Everyday" },
  { w: "GRATITUDE", d: "A feeling of thankfulness and appreciation", c: "Everyday" },
  { w: "CURIOSITY", d: "A strong desire to learn or know something", c: "Everyday" },
  { w: "IMAGINATION", d: "The ability to form new ideas or images in the mind", c: "Everyday" },
  { w: "ADVENTURE", d: "An exciting or unusual experience", c: "Everyday" },
  { w: "JOURNEY", d: "An act of traveling from one place to another", c: "Everyday" },
  { w: "HOLIDAY", d: "A day of celebration or a period of rest from work", c: "Everyday" },
  { w: "WEEKEND", d: "The last two days of the week, usually a time off work", c: "Everyday" },
  { w: "SUNSET", d: "The moment the sun disappears below the horizon in the evening", c: "Everyday" },
  { w: "SUNRISE", d: "The moment the sun first appears above the horizon", c: "Everyday" },
  { w: "RAINBOW", d: "An arc of colors that appears in the sky after rain", c: "Everyday" },
  { w: "THUNDER", d: "The loud rumbling sound that follows a flash of lightning", c: "Everyday" },
  { w: "LIGHTNING", d: "A brilliant flash of light produced by a storm", c: "Everyday" },
  { w: "BREEZE", d: "A gentle, light wind", c: "Everyday" },
];

/* Assign a difficulty tier from word length: 1 easy, 2 medium, 3 hard */
const withDifficulty = WORD_BANK.map((item) => ({
  ...item,
  diff: item.w.length <= 5 ? 1 : item.w.length <= 8 ? 2 : 3,
}));

const CATEGORIES = ["Animals", "Food", "Sports", "Technology", "Geography", "Science", "Everyday"];

/* ----------------------------------------------------------------------- */
/* UTILITIES                                                                */
/* ----------------------------------------------------------------------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_OFFSET = { easy: 0, medium: 1, hard: 2 };

function pickWordForLevel(level, usedWords, difficulty = "easy") {
  const offset = DIFFICULTY_OFFSET[difficulty] ?? 0;
  const target = Math.max(3, Math.round(4 + (level - 1) * 0.55 + offset));
  const minLen = Math.max(3, target - 1);
  const maxLen = target + 1;
  let pool = withDifficulty.filter(
    (x) => x.w.length >= minLen && x.w.length <= maxLen && !usedWords.has(x.w)
  );
  if (pool.length < 4) {
    pool = withDifficulty.filter(
      (x) => x.w.length >= Math.max(3, minLen - 2) && x.w.length <= maxLen + 2 && !usedWords.has(x.w)
    );
  }
  if (pool.length === 0) pool = withDifficulty.filter((x) => !usedWords.has(x.w));
  if (pool.length === 0) pool = withDifficulty;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildKeyboard(word) {
  const letters = word.split("");
  const tiles = shuffle(letters).map((letter, i) => ({
    id: `${letter}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    letter,
    used: false,
  }));
  return tiles;
}

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
}

const WORDS_PER_LEVEL = 5;

/* ----------------------------------------------------------------------- */
/* SOUND ENGINE — synthesized with the Web Audio API, no external files    */
/* ----------------------------------------------------------------------- */
function useSoundEngine(enabled) {
  const ctxRef = useRef(null);
  const ambientRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq, dur, type = "sine", vol = 0.18, delay = 0) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    [enabled, getCtx]
  );

  const sounds = useMemo(
    () => ({
      click: () => tone(520, 0.07, "triangle", 0.14),
      place: () => tone(740, 0.09, "sine", 0.16),
      remove: () => tone(340, 0.08, "sine", 0.12),
      correct: () => {
        tone(523, 0.14, "triangle", 0.2);
        tone(659, 0.14, "triangle", 0.2, 0.09);
        tone(784, 0.22, "triangle", 0.22, 0.18);
      },
      wrong: () => {
        tone(220, 0.18, "sawtooth", 0.16);
        tone(160, 0.22, "sawtooth", 0.14, 0.08);
      },
      hint: () => tone(880, 0.12, "sine", 0.15),
      victory: () => {
        [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.22, i * 0.11));
      },
      gameover: () => {
        [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, "sawtooth", 0.16, i * 0.14));
      },
      levelup: () => {
        tone(660, 0.12, "square", 0.14);
        tone(880, 0.18, "square", 0.16, 0.1);
      },
    }),
    [tone]
  );

  useEffect(() => {
    if (!enabled) {
      ambientRef.current?.stop?.();
      ambientRef.current = null;
      return;
    }
    const ctx = getCtx();
    if (!ctx) return;
    let stopped = false;
    let timerId = null;

    /* ---- summer chord progression (I – V – vi – IV in C major) ---- */
    const chords = [
      [261.6, 329.6, 392.0],  // C major
      [392.0, 493.9, 587.3],  // G major
      [440.0, 523.3, 659.3],  // A minor
      [349.2, 440.0, 523.3],  // F major
    ];
    const beatDur = 1.0;       // seconds per chord
    let chordIdx = 0;

    /* master gain — fade in over 1.5s */
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.5);
    master.connect(ctx.destination);

    /* warm pad filter */
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 900;
    padFilter.Q.value = 0.7;
    padFilter.connect(master);

    function playChord() {
      if (stopped) return;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      /* pad — three soft sines for each chord tone */
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.08, ctx.currentTime + beatDur * 0.7);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.98);
        osc.connect(g);
        g.connect(padFilter);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + beatDur + 0.05);
      });

      /* octave shimmer — one higher sine per chord for sparkle */
      const shimmer = ctx.createOscillator();
      const sg = ctx.createGain();
      shimmer.type = "sine";
      shimmer.frequency.value = chord[0] * 2;
      sg.gain.setValueAtTime(0, ctx.currentTime);
      sg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.08);
      sg.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.5);
      shimmer.connect(sg);
      sg.connect(padFilter);
      shimmer.start(ctx.currentTime);
      shimmer.stop(ctx.currentTime + beatDur * 0.6);

      /* light percussive tick — tiny noise burst on the beat */
      const bufLen = Math.floor(ctx.sampleRate * 0.03);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufLen);
      const tick = ctx.createBufferSource();
      tick.buffer = buf;
      const tickGain = ctx.createGain();
      tickGain.gain.value = 0.045;
      const tickFilter = ctx.createBiquadFilter();
      tickFilter.type = "highpass";
      tickFilter.frequency.value = 2000;
      tick.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(master);
      tick.start(ctx.currentTime);

      timerId = setTimeout(playChord, beatDur * 1000);
    }

    playChord();

    ambientRef.current = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        if (timerId) clearTimeout(timerId);
        try {
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
          setTimeout(() => {
            try { master.disconnect(); } catch {}
          }, 500);
        } catch {}
      },
    };
    return () => ambientRef.current?.stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  /* pause bg music when tab is hidden, restart when visible */
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        ambientRef.current?.stop?.();
        ambientRef.current = null;
      } else {
        /* trigger the ambient effect to restart by toggling enabled concept —
           instead we just re-run the start logic inline */
        const ctx = getCtx();
        if (!ctx) return;
        /* stop was already called, so ambientRef is null — the main effect
           won't re-run. Manually restart: */
        let stopped = false;
        let timerId = null;
        const chords = [
          [261.6, 329.6, 392.0],
          [392.0, 493.9, 587.3],
          [440.0, 523.3, 659.3],
          [349.2, 440.0, 523.3],
        ];
        const beatDur = 1.0;
        let chordIdx = 0;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.5);
        master.connect(ctx.destination);
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.value = 900;
        padFilter.Q.value = 0.7;
        padFilter.connect(master);
        function playChord() {
          if (stopped) return;
          const chord = chords[chordIdx % chords.length];
          chordIdx++;
          chord.forEach((freq) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12);
            g.gain.setValueAtTime(0.08, ctx.currentTime + beatDur * 0.7);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.98);
            osc.connect(g);
            g.connect(padFilter);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + beatDur + 0.05);
          });
          const shimmer = ctx.createOscillator();
          const sg = ctx.createGain();
          shimmer.type = "sine";
          shimmer.frequency.value = chord[0] * 2;
          sg.gain.setValueAtTime(0, ctx.currentTime);
          sg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.08);
          sg.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.5);
          shimmer.connect(sg);
          sg.connect(padFilter);
          shimmer.start(ctx.currentTime);
          shimmer.stop(ctx.currentTime + beatDur * 0.6);
          const bufLen = Math.floor(ctx.sampleRate * 0.03);
          const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let j = 0; j < bufLen; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufLen);
          const tick = ctx.createBufferSource();
          tick.buffer = buf;
          const tickGain = ctx.createGain();
          tickGain.gain.value = 0.045;
          const tickFilter = ctx.createBiquadFilter();
          tickFilter.type = "highpass";
          tickFilter.frequency.value = 2000;
          tick.connect(tickFilter);
          tickFilter.connect(tickGain);
          tickGain.connect(master);
          tick.start(ctx.currentTime);
          timerId = setTimeout(playChord, beatDur * 1000);
        }
        playChord();
        ambientRef.current = {
          stop: () => {
            if (stopped) return;
            stopped = true;
            if (timerId) clearTimeout(timerId);
            try {
              master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
              setTimeout(() => { try { master.disconnect(); } catch {} }, 500);
            } catch {}
          },
        };
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, getCtx]);

  return sounds;
}

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/* ----------------------------------------------------------------------- */
/* SMALL VISUAL PIECES                                                     */
/* ----------------------------------------------------------------------- */
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 10,
        dur: 14 + Math.random() * 16,
        delay: -Math.random() * 20,
        opacity: 0.08 + Math.random() * 0.18,
      })),
    []
  );
  return (
    <div className="vg-particles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="vg-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* Sunny sky scene: sun rays, drifting clouds, grass horizon, palm trees —
   the flat "mobile-game-kit" backdrop the whole UI sits on. */
function SkyScene() {
  const clouds = useMemo(
    () => [
      { top: "8%", left: "6%", scale: 1.1, dur: 46, delay: 0 },
      { top: "16%", left: "62%", scale: 0.8, dur: 38, delay: -10 },
      { top: "5%", left: "38%", scale: 0.65, dur: 52, delay: -24 },
      { top: "27%", left: "80%", scale: 0.9, dur: 42, delay: -6 },
    ],
    []
  );
  return (
    <div className="vg-scene" aria-hidden="true">
      <div className="vg-sun">
        <div className="vg-sun-rays" />
        <div className="vg-sun-core" />
      </div>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="vg-cloud"
          style={{ top: c.top, left: c.left, "--scale": c.scale, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          <svg viewBox="0 0 120 60" width="120" height="60">
            <ellipse cx="30" cy="38" rx="26" ry="18" fill="#fff" />
            <ellipse cx="60" cy="26" rx="30" ry="24" fill="#fff" />
            <ellipse cx="90" cy="38" rx="24" ry="17" fill="#fff" />
            <rect x="14" y="36" width="92" height="20" rx="10" fill="#fff" />
          </svg>
        </div>
      ))}
      <svg className="vg-palm vg-palm-left" viewBox="0 0 120 220" width="110" height="200">
        <path d="M60 220 L64 90" stroke="#0f7a3d" strokeWidth="12" strokeLinecap="round" fill="none" />
        <g fill="#1aa551">
          <path d="M64 92 C40 76 18 78 4 66 C24 60 46 64 64 78 Z" />
          <path d="M64 90 C36 82 14 92 -2 88 C14 76 40 74 64 82 Z" />
          <path d="M64 88 C48 60 46 34 34 16 C54 26 66 52 68 82 Z" />
          <path d="M65 86 C70 56 84 34 82 10 C96 30 92 60 70 84 Z" />
          <path d="M64 90 C84 78 104 82 118 72 C100 64 78 66 62 80 Z" />
        </g>
      </svg>
      <svg className="vg-palm vg-palm-right" viewBox="0 0 120 220" width="130" height="230">
        <path d="M60 220 L56 80" stroke="#0f7a3d" strokeWidth="13" strokeLinecap="round" fill="none" />
        <g fill="#1aa551">
          <path d="M56 82 C30 64 6 66 -8 52 C14 44 40 50 58 66 Z" />
          <path d="M56 80 C26 70 2 82 -14 76 C4 62 32 60 58 70 Z" />
          <path d="M56 78 C40 46 38 18 24 -2 C46 10 60 40 62 72 Z" />
          <path d="M57 76 C63 42 80 18 76 -10 C92 12 88 46 64 74 Z" />
          <path d="M56 80 C78 66 100 70 116 58 C96 48 72 52 54 68 Z" />
        </g>
      </svg>
      <div className="vg-grass" />
    </div>
  );
}

function Confetti({ active }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        color: ["#ff5c5c", "#2ec4b6", "#ffd93d", "#a66bff", "#ffffff"][i % 5],
        rotate: Math.random() * 360,
        delay: Math.random() * 0.25,
        dur: 0.9 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 120,
      })),
    [active]
  );
  if (!active) return null;
  return (
    <div className="vg-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="vg-confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function Heart({ alive, justLost }) {
  return (
    <svg
      className={`vg-heart ${!alive ? "vg-heart-dead" : ""} ${justLost ? "vg-heart-pulse" : ""}`}
      viewBox="0 0 24 24"
      width="22"
      height="22"
    >
      <path
        d="M12 21s-7.5-4.6-10.2-9.3C.2 8.7 1.6 5 5.3 5c2 0 3.4 1 4.7 2.7C11.3 6 12.7 5 14.7 5c3.7 0 5.1 3.7 3.5 6.7C19.5 16.4 12 21 12 21z"
        fill={alive ? "#ff5c5c" : "none"}
        stroke={alive ? "#c92a2a" : "rgba(255,255,255,0.6)"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function AnimatedNumber({ value, duration = 500 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

/* ----------------------------------------------------------------------- */
/* MAIN COMPONENT                                                          */
/* ----------------------------------------------------------------------- */
export default function VocabularyGuess({ gameData, sessionToken, onComplete }) {
  /* Persistent stats */
  const [best, setBest] = useState(gameData?.high_score || 0);
  const [stats, setStats] = useState(() =>
    loadLocal("vg_stats", { gamesPlayed: 0, totalCorrect: 0, totalWrong: 0, totalXp: 0 })
  );

  const gameIdRef = useRef(gameData?.id);
  useEffect(() => { gameIdRef.current = gameData?.id }, [gameData]);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  /* Screen + core game state */
  const [screen, setScreen] = useState("home"); // home | playing | paused | levelComplete | gameOver | stats
  const [soundOn, setSoundOn] = useState(true);
  const [difficulty, setDifficulty] = useState("easy"); // easy | medium | hard — starting point, ramps up from there
  const sounds = useSoundEngine(soundOn);

  const [level, setLevel] = useState(1);
  const [wordsThisLevel, setWordsThisLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [usedWords, setUsedWords] = useState(() => new Set());

  const [current, setCurrent] = useState(null); // {w,d,c,diff}
  const [slots, setSlots] = useState([]); // array of {letter, tileId} | null
  const [keyboard, setKeyboard] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [heartLoss, setHeartLoss] = useState(false);

  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [confettiActive, setConfettiActive] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);

  const playerLevel = Math.floor(xp / 150) + 1;
  const xpIntoLevel = xp % 150;

  /* ---------- persistence effects ---------- */
  useEffect(() => {
    if (score > best) {
      setBest(score);
      saveLocal("vg_best_score", score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  /* ---------- round setup ---------- */
  const startRound = useCallback(
    (lvl, used) => {
      const word = pickWordForLevel(lvl, used, difficulty);
      const nextUsed = new Set(used);
      nextUsed.add(word.w);
      setUsedWords(nextUsed);
      setCurrent(word);
      setSlots(Array.from({ length: word.w.length }, () => null));
      setKeyboard(buildKeyboard(word.w));
      setFeedback(null);
      setCardVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setCardVisible(true)));
    },
    [difficulty]
  );

  const beginGame = useCallback(() => {
    const fresh = new Set();
    setLevel(1);
    setWordsThisLevel(0);
    setLives(3);
    setScore(0);
    setCombo(0);
    setXp(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHintsUsed(0);
    setSkipsUsed(0);
    setUsedWords(fresh);
    startRound(1, fresh);
    setScreen("playing");
  }, [startRound]);

  /* ---------- interactions ---------- */
  const handleTileClick = (tile) => {
    if (tile.used || feedback === "correct" || feedback === "wrong") return;
    const emptyIndex = slots.findIndex((s) => s === null);
    if (emptyIndex === -1) return;
    sounds.place();
    vibrate(8);
    const newSlots = [...slots];
    newSlots[emptyIndex] = { letter: tile.letter, tileId: tile.id };
    setSlots(newSlots);
    setKeyboard((kb) => kb.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));

    if (newSlots.every((s) => s !== null)) {
      const guess = newSlots.map((s) => s.letter).join("");
      setTimeout(() => evaluateGuess(guess, newSlots), 220);
    }
  };

  const handleSlotClick = (index) => {
    const slot = slots[index];
    if (!slot || feedback === "correct" || feedback === "wrong") return;
    sounds.remove();
    setKeyboard((kb) => kb.map((t) => (t.id === slot.tileId ? { ...t, used: false } : t)));
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const evaluateGuess = (guess, filledSlots) => {
    if (guess === current.w) {
      sounds.correct();
      vibrate([10, 40, 10]);
      setFeedback("correct");
      setConfettiActive(true);
      const newCombo = combo + 1;
      const base = 10 * current.w.length;
      const comboBonus = Math.min(newCombo, 10) * 5;
      const gained = base + comboBonus;
      setScore((s) => s + gained);
      setXp((x) => x + Math.round(gained * 0.6));
      setCombo(newCombo);
      setCorrectCount((c) => c + 1);

      setTimeout(() => setConfettiActive(false), 900);
      setTimeout(() => {
        const nextWordsThisLevel = wordsThisLevel + 1;
        if (nextWordsThisLevel >= WORDS_PER_LEVEL) {
          sounds.levelup();
          setScreen("levelComplete");
        } else {
          setWordsThisLevel(nextWordsThisLevel);
          startRound(level, usedWords);
        }
      }, 750);
    } else {
      sounds.wrong();
      vibrate([30, 30, 30]);
      setFeedback("wrong");
      setCombo(0);
      setWrongCount((c) => c + 1);
      setHeartLoss(true);
      setTimeout(() => setHeartLoss(false), 650);

      setTimeout(() => {
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) {
            sounds.gameover();
            finalizeStats(true);
            setScreen("gameOver");
            const finalScore = scoreRef.current;
            if (finalScore > 0 && gameIdRef.current) {
              try {
                let devId = null;
                try { devId = localStorage.getItem('device_id') || null } catch {}
                fetch('/api/play/record-score', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ game_id: gameIdRef.current, score: finalScore, device_id: devId || undefined })
                }).then(r => r.json()).then(d => { if (d && d.success && d.high_score) { setBest(p => Math.max(p, d.high_score)); saveLocal("vg_best_score", d.high_score); } }).catch(() => {})
              } catch {}
            }
          } else {
            // return letters, clear slots, keep same word
            setSlots(Array.from({ length: current.w.length }, () => null));
            setKeyboard((kb) => kb.map((t) => ({ ...t, used: false })));
            setFeedback(null);
          }
          return nl;
        });
      }, 550);
    }
  };

  const finalizeStats = (isGameOver) => {
    if (!isGameOver) return;
    const updated = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalCorrect: stats.totalCorrect + correctCount,
      totalWrong: stats.totalWrong + wrongCount,
      totalXp: stats.totalXp + xp,
    };
    setStats(updated);
    saveLocal("vg_stats", updated);
  };

  const handleHint = () => {
    if (!current || feedback || hintsUsed >= 3) return;
    const emptyIndex = slots.findIndex((s) => s === null);
    if (emptyIndex === -1) return;
    const neededLetter = current.w[emptyIndex];
    const candidate = keyboard.find((t) => !t.used && t.letter === neededLetter);
    if (!candidate) return;
    sounds.hint();
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - 5));
    handleTileClick(candidate);
  };

  const handleShuffle = () => {
    sounds.click();
    setKeyboard((kb) => shuffle(kb));
  };

  const handleSkip = () => {
    if (!current || skipsUsed >= 3) return;
    sounds.click();
    setSkipsUsed((s) => s + 1);
    setCombo(0);
    setWordsThisLevel((w) => Math.min(w + 1, WORDS_PER_LEVEL));
    const nextWordsThisLevel = wordsThisLevel + 1;
    if (nextWordsThisLevel >= WORDS_PER_LEVEL) {
      setScreen("levelComplete");
    } else {
      startRound(level, usedWords);
    }
  };

  const goToNextLevel = () => {
    sounds.click();
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setWordsThisLevel(0);
    startRound(nextLevel, usedWords);
    setScreen("playing");
  };

  const togglePause = () => {
    sounds.click();
    setScreen((s) => (s === "playing" ? "paused" : "playing"));
  };

  const quitToHome = () => {
    sounds.click();
    if (screen === "playing" || screen === "paused") {
      finalizeStats(true);
    }
    setScreen("home");
  };

  const accuracy = correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
  const progressPct = Math.min(100, (wordsThisLevel / WORDS_PER_LEVEL) * 100);

  /* ----------------------------------------------------------------------- */
  return (
    <div className="vg-root">
      <StyleSheet />
      <SkyScene />
      <FloatingParticles />

      {screen === "home" && (
        <HomeScreen
          best={best}
          onPlay={beginGame}
          onStats={() => setScreen("stats")}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />
      )}

      {(screen === "playing" || screen === "paused") && current && (
        <div className="vg-game-wrap">
          <TopBar
            soundOn={soundOn}
            onToggleSound={() => setSoundOn((s) => !s)}
            onHint={handleHint}
            hintsUsed={hintsUsed}
            lives={lives}
            heartLoss={heartLoss}
            score={score}
            combo={combo}
            onPause={togglePause}
          />

          <div className={`vg-center ${cardVisible ? "vg-fade-in" : "vg-fade-out"}`}>
            <div className="vg-category-tag">{current.c}</div>
            <div className={`vg-def-card ${feedback === "wrong" ? "vg-shake" : ""}`}>
              <p className="vg-def-text">{current.d}</p>
            </div>

            <div className={`vg-slots ${feedback === "wrong" ? "vg-shake" : ""}`}>
              {slots.map((slot, i) => (
                <button
                  key={i}
                  className={`vg-slot ${slot ? "vg-slot-filled" : ""} ${
                    feedback === "correct" ? "vg-slot-correct" : ""
                  } ${feedback === "wrong" ? "vg-slot-wrong" : ""}`}
                  onClick={() => handleSlotClick(i)}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {slot?.letter}
                </button>
              ))}
            </div>

            <div className="vg-tools">
              <button className="vg-tool-btn" onClick={handleShuffle}>
                <ShuffleIcon /> Shuffle
              </button>
              <button className={`vg-tool-btn ${skipsUsed >= 3 ? "vg-btn-disabled" : ""}`} onClick={handleSkip} disabled={skipsUsed >= 3}>
                <SkipIcon /> Skip ({3 - skipsUsed})
              </button>
            </div>

            <div className="vg-keyboard">
              {keyboard.map((tile) => (
                <button
                  key={tile.id}
                  className={`vg-key ${tile.used ? "vg-key-used" : ""}`}
                  disabled={tile.used}
                  onClick={() => handleTileClick(tile)}
                >
                  {tile.letter}
                </button>
              ))}
            </div>
          </div>

          <BottomBar level={level} progressPct={progressPct} />

          <Confetti active={confettiActive} />

          {screen === "paused" && (
            <PauseOverlay onResume={togglePause} onQuit={quitToHome} soundOn={soundOn} setSoundOn={setSoundOn} />
          )}
        </div>
      )}

      {screen === "levelComplete" && (
        <LevelCompleteScreen
          level={level}
          score={score}
          combo={combo}
          onContinue={goToNextLevel}
          playerLevel={playerLevel}
          xpIntoLevel={xpIntoLevel}
        />
      )}

      {screen === "gameOver" && (
        <GameOverScreen
          score={score}
          best={best}
          accuracy={accuracy}
          level={level}
          onRetry={beginGame}
          onHome={() => setScreen("home")}
        />
      )}

      {screen === "stats" && <StatsScreen stats={stats} best={best} onBack={() => setScreen("home")} />}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* SCREENS                                                                  */
/* ----------------------------------------------------------------------- */
const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "var(--teal)", shadow: "var(--teal-shadow)" },
  { id: "medium", label: "Medium", color: "var(--yellow)", shadow: "var(--yellow-shadow)" },
  { id: "hard", label: "Hard", color: "var(--red)", shadow: "var(--red-shadow)" },
];

function HomeScreen({ best, onPlay, onStats, soundOn, setSoundOn, difficulty, setDifficulty }) {
  return (
    <div className="vg-home vg-fade-in">
      <button className="vg-icon-btn vg-home-sound" onClick={() => setSoundOn((s) => !s)}>
        {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
      </button>

      <div className="vg-logo">
        <svg width="104" height="104" viewBox="0 0 104 104" className="vg-logo-mark">
          <defs>
            <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffe58a" />
              <stop offset="100%" stopColor="#ffb347" />
            </linearGradient>
          </defs>
          <path d="M20 78 L10 100 L34 92 Z" fill="#ff5c5c" />
          <path d="M84 78 L94 100 L70 92 Z" fill="#ff5c5c" />
          <circle cx="52" cy="46" r="40" fill="url(#badgeGrad)" stroke="#c9791a" strokeWidth="3" />
          <circle cx="52" cy="46" r="30" fill="none" stroke="#fff6d8" strokeWidth="2.5" strokeDasharray="4 5" />
          <text x="52" y="57" textAnchor="middle" fontSize="34" fontWeight="800" fill="#a85a12" fontFamily="inherit">
            Aa
          </text>
        </svg>
      </div>

      <h1 className="vg-title">
        Vocabulary <span className="vg-title-accent">Guess</span>
      </h1>
      <p className="vg-subtitle">Read the clue. Build the word. Beat your best.</p>

      <div className="vg-home-best">
        <span className="vg-home-best-label">Best Score</span>
        <span className="vg-home-best-value">
          <AnimatedNumber value={best} />
        </span>
      </div>

      <div className="vg-diff-label">Choose Difficulty</div>
      <div className="vg-diff-row">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            className={`vg-diff-btn ${difficulty === d.id ? "vg-diff-btn-active" : ""}`}
            style={{ "--diff-color": d.color, "--diff-shadow": d.shadow }}
            onClick={() => setDifficulty(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="vg-diff-hint">
        {difficulty === "easy" && "Starts easy, gets harder as you level up."}
        {difficulty === "medium" && "Jumps straight to medium words, then hard."}
        {difficulty === "hard" && "Toughest words from level one."}
      </p>

      <button className="vg-primary-btn" onClick={onPlay}>
        <PlayIcon />
        Play
      </button>
      <button className="vg-secondary-btn" onClick={onStats}>
        <ChartIcon />
        Statistics
      </button>

      <div className="vg-home-categories">
        {CATEGORIES.map((c) => (
          <span key={c} className="vg-chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopBar({ soundOn, onToggleSound, onHint, hintsUsed, lives, heartLoss, score, combo, onPause }) {
  const hintsLeft = 3 - hintsUsed;
  return (
    <div className="vg-topbar">
      <div className="vg-topbar-left">
        <button className="vg-icon-btn" onClick={onToggleSound} aria-label="Toggle sound">
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button className={`vg-icon-btn ${hintsLeft <= 0 ? "vg-btn-disabled" : ""}`} onClick={onHint} disabled={hintsLeft <= 0} aria-label="Hint">
          <HintIcon />
          <span className="vg-btn-badge">{hintsLeft}</span>
        </button>
      </div>

      <div className="vg-hearts">
        {[0, 1, 2].map((i) => (
          <Heart key={i} alive={i < lives} justLost={heartLoss && i === lives} />
        ))}
      </div>

      <div className="vg-topbar-right">
        {combo > 1 && <span className="vg-combo">x{combo} combo</span>}
        <div className="vg-score">
          <AnimatedNumber value={score} />
        </div>
        <button className="vg-icon-btn" onClick={onPause} aria-label="Pause">
          <PauseIcon />
        </button>
      </div>
    </div>
  );
}

function BottomBar({ level, progressPct }) {
  return (
    <div className="vg-bottombar">
      <div className="vg-level-label">Level {level}</div>
      <div className="vg-progress-track">
        <div className="vg-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}

function PauseOverlay({ onResume, onQuit, soundOn, setSoundOn }) {
  return (
    <div className="vg-overlay vg-fade-in">
      <div className="vg-panel">
        <h2 className="vg-panel-title">Paused</h2>
        <button className="vg-primary-btn" onClick={onResume}>
          <PlayIcon /> Resume
        </button>
        <button className="vg-secondary-btn" onClick={() => setSoundOn((s) => !s)}>
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
          {soundOn ? "Sound On" : "Sound Off"}
        </button>
        <button className="vg-ghost-btn" onClick={onQuit}>
          Quit to Menu
        </button>
      </div>
    </div>
  );
}

function LevelCompleteScreen({ level, score, combo, onContinue, playerLevel, xpIntoLevel }) {
  return (
    <div className="vg-overlay-solid vg-fade-in">
      <Confetti active={true} />
      <div className="vg-panel vg-panel-celebrate">
        <div className="vg-trophy">
          <TrophyIcon />
        </div>
        <h2 className="vg-panel-title">Level {level} Complete!</h2>
        <p className="vg-panel-sub">Great vocabulary. The words get trickier from here.</p>

        <div className="vg-stat-row">
          <div className="vg-stat-block">
            <span className="vg-stat-value">
              <AnimatedNumber value={score} />
            </span>
            <span className="vg-stat-label">Score</span>
          </div>
          <div className="vg-stat-block">
            <span className="vg-stat-value">{combo}</span>
            <span className="vg-stat-label">Best Combo</span>
          </div>
          <div className="vg-stat-block">
            <span className="vg-stat-value">{playerLevel}</span>
            <span className="vg-stat-label">Player Lvl</span>
          </div>
        </div>

        <div className="vg-xp-track">
          <div className="vg-xp-fill" style={{ width: `${(xpIntoLevel / 150) * 100}%` }} />
        </div>

        <button className="vg-primary-btn" onClick={onContinue}>
          <ArrowIcon /> Continue
        </button>
      </div>
    </div>
  );
}

function GameOverScreen({ score, best, accuracy, level, onRetry, onHome }) {
  const isNewBest = score >= best && score > 0;
  return (
    <div className="vg-overlay-solid vg-fade-in">
      <div className="vg-panel">
        <div className="vg-gameover-icon">
          <GameOverIcon />
        </div>
        <h2 className="vg-panel-title">Game Over</h2>
        {isNewBest && <p className="vg-newbest">New Best Score!</p>}

        <div className="vg-stat-row">
          <div className="vg-stat-block">
            <span className="vg-stat-value">
              <AnimatedNumber value={score} />
            </span>
            <span className="vg-stat-label">Score</span>
          </div>
          <div className="vg-stat-block">
            <span className="vg-stat-value">{accuracy}%</span>
            <span className="vg-stat-label">Accuracy</span>
          </div>
          <div className="vg-stat-block">
            <span className="vg-stat-value">{level}</span>
            <span className="vg-stat-label">Level Reached</span>
          </div>
        </div>

        <button className="vg-primary-btn" onClick={onRetry}>
          <PlayIcon /> Play Again
        </button>
        <button className="vg-ghost-btn" onClick={onHome}>
          Main Menu
        </button>
      </div>
    </div>
  );
}

function StatsScreen({ stats, best, onBack }) {
  const totalAnswers = stats.totalCorrect + stats.totalWrong;
  const acc = totalAnswers > 0 ? Math.round((stats.totalCorrect / totalAnswers) * 100) : 0;
  return (
    <div className="vg-overlay-solid vg-fade-in">
      <div className="vg-panel">
        <h2 className="vg-panel-title">Statistics</h2>
        <div className="vg-stats-list">
          <div className="vg-stats-row">
            <span>Best Score</span>
            <strong>{best.toLocaleString()}</strong>
          </div>
          <div className="vg-stats-row">
            <span>Games Played</span>
            <strong>{stats.gamesPlayed}</strong>
          </div>
          <div className="vg-stats-row">
            <span>Words Guessed</span>
            <strong>{stats.totalCorrect}</strong>
          </div>
          <div className="vg-stats-row">
            <span>Overall Accuracy</span>
            <strong>{acc}%</strong>
          </div>
          <div className="vg-stats-row">
            <span>Total XP</span>
            <strong>{stats.totalXp.toLocaleString()}</strong>
          </div>
        </div>
        <button className="vg-primary-btn" onClick={onBack}>
          <ArrowIcon /> Back
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* ICONS — small inline SVGs, no external assets                           */
/* ----------------------------------------------------------------------- */
function SoundOnIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
      <path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function SoundOffIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
      <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function HintIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.5.4.8 1 .8 1.6v.6h5.6v-.6c0-.6.3-1.2.8-1.6A6 6 0 0012 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5v15l13-7.5-13-7.5z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
function SkipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5l10 7-10 7V5zM17 5h2v14h-2z" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 4h8v4a4 4 0 01-8 0V4zM6 5H4a3 3 0 003 3M18 5h2a3 3 0 01-3 3M10 13v3M14 13v3M8 20h8M9 17h6v3H9v-3z"
        stroke="#ff9d1f"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function GameOverIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#ff5c5c" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#ff5c5c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/* STYLES — injected once, glassmorphism + deep purple / orange theme      */
/* ----------------------------------------------------------------------- */
function StyleSheet() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap');

      .vg-root {
        /* ---- flat sunny mobile-game-kit palette ---- */
        --sky-top: #7fd4f2;
        --sky-bottom: #bdeaf7;
        --grass-dark: #4fae2e;
        --grass-light: #7ed957;
        --red: #ff5c5c;
        --red-shadow: #d63c3c;
        --teal: #2ec4b6;
        --teal-shadow: #1a9d90;
        --purple: #a66bff;
        --purple-shadow: #7f3fe0;
        --yellow: #ffd93d;
        --yellow-shadow: #e6a800;
        --cream: #fff8e8;
        --panel: #ffffff;
        --panel-border: #e3d9c0;
        --ink: #4a3418;
        --ink-soft: #8a7a5c;
        position: relative;
        min-height: 100vh;
        width: 100%;
        overflow: hidden;
        background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-bottom) 70%);
        font-family: 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: var(--ink);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .vg-root *, .vg-root *::before, .vg-root *::after { box-sizing: border-box; }
      .vg-root button { font-family: inherit; cursor: pointer; border: none; color: inherit; }
      .vg-root h1, .vg-root h2 { font-family: 'Baloo 2', 'Nunito', sans-serif; }

      /* ---------- sunny background scene ---------- */
      .vg-scene { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
      .vg-sun { position: absolute; top: -40px; right: -30px; width: 180px; height: 180px; }
      .vg-sun-core {
        position: absolute; inset: 30px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff2b8, var(--yellow) 65%);
        box-shadow: 0 0 40px rgba(255,217,61,0.7);
      }
      .vg-sun-rays {
        position: absolute; inset: 0; border-radius: 50%;
        background: repeating-conic-gradient(rgba(255,224,110,0.55) 0deg 6deg, transparent 6deg 24deg);
        animation: vg-sun-spin 60s linear infinite;
        mask: radial-gradient(circle, transparent 45%, black 46%);
        -webkit-mask: radial-gradient(circle, transparent 45%, black 46%);
      }
      @keyframes vg-sun-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

      .vg-cloud { position: absolute; animation: vg-drift linear infinite; opacity: 0.95; filter: drop-shadow(0 6px 10px rgba(40,90,120,0.12)); transform: scale(var(--scale, 1)); }
      @keyframes vg-drift {
        from { transform: translateX(-10vw) scale(var(--scale, 1)); }
        to { transform: translateX(110vw) scale(var(--scale, 1)); }
      }

      .vg-palm { position: absolute; bottom: 0; z-index: 1; filter: drop-shadow(0 6px 8px rgba(15,60,20,0.18)); }
      .vg-palm-left { left: -12px; transform-origin: bottom center; animation: vg-sway 6s ease-in-out infinite; }
      .vg-palm-right { right: -18px; transform-origin: bottom center; animation: vg-sway 7s ease-in-out infinite -2s; }
      @keyframes vg-sway { 0%,100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }

      .vg-grass {
        position: absolute; left: 0; right: 0; bottom: 0; height: 64px; z-index: 1;
        background: linear-gradient(180deg, var(--grass-light) 0%, var(--grass-dark) 100%);
        border-top: 6px solid #3f9425;
        box-shadow: 0 -4px 0 rgba(255,255,255,0.15) inset;
      }
      .vg-grass::before {
        content: ""; position: absolute; top: -14px; left: 0; right: 0; height: 16px;
        background:
          radial-gradient(circle at 6% 100%, transparent 8px, var(--grass-light) 8.5px) 0 0/32px 16px repeat-x;
      }

      /* ---------- particles (gentle sparkle, kept subtle) ---------- */
      .vg-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
      .vg-particle {
        position: absolute; bottom: -20px; border-radius: 50%;
        background: radial-gradient(circle, #fff, rgba(255,255,255,0));
        animation: vg-float linear infinite;
      }
      @keyframes vg-float {
        0% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-52vh) translateX(20px); }
        100% { transform: translateY(-105vh) translateX(-10px); }
      }

      /* ---------- confetti ---------- */
      .vg-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; }
      .vg-confetti-piece {
        position: absolute; top: -10%; width: 8px; height: 14px; border-radius: 2px;
        animation: vg-confetti-fall ease-in forwards;
      }
      @keyframes vg-confetti-fall {
        0% { top: -10%; opacity: 1; transform: translateX(0) rotate(0deg); }
        100% { top: 105%; opacity: 0; transform: translateX(var(--drift)) rotate(540deg); }
      }

      /* ---------- generic fade ---------- */
      .vg-fade-in { animation: vg-fadein 0.4s ease both; }
      .vg-fade-out { animation: vg-fadeout 0.15s ease both; }
      @keyframes vg-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes vg-fadeout { from { opacity: 1; } to { opacity: 0; } }

      /* ---------- shared buttons: chunky flat "3D bottom border" style ---------- */
      .vg-icon-btn {
        display: flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; border-radius: 14px;
        background: var(--panel); border: 2px solid var(--panel-border);
        border-bottom: 4px solid var(--panel-border);
        color: var(--purple-shadow); transition: transform .1s ease, box-shadow .15s ease;
        box-shadow: 0 4px 10px rgba(40,60,20,0.12);
      }
      .vg-icon-btn:hover { transform: translateY(-2px); }
      .vg-icon-btn:active { transform: translateY(2px); border-bottom-width: 2px; }
      .vg-icon-btn.vg-btn-disabled { opacity: 0.4; pointer-events: none; }
      .vg-btn-badge {
        position: absolute; top: -4px; right: -4px;
        background: var(--red); color: #fff; font-size: 10px; font-weight: 700;
        width: 18px; height: 18px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid var(--cream); line-height: 1;
      }
      .vg-icon-btn { position: relative; }

      .vg-primary-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; max-width: 320px; padding: 15px 20px; border-radius: 18px;
        background: var(--red); border-bottom: 6px solid var(--red-shadow);
        color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 17px;
        text-shadow: 0 2px 0 rgba(0,0,0,0.15);
        box-shadow: 0 6px 16px rgba(214,60,60,0.35);
        transition: transform .12s ease, box-shadow .12s ease, border-bottom-width .12s ease; margin: 8px 0;
      }
      .vg-primary-btn:hover { transform: translateY(-2px); }
      .vg-primary-btn:active { transform: translateY(4px); border-bottom-width: 2px; }

      .vg-secondary-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; max-width: 320px; padding: 13px 20px; border-radius: 18px;
        background: var(--teal); border-bottom: 6px solid var(--teal-shadow);
        color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px;
        text-shadow: 0 2px 0 rgba(0,0,0,0.12);
        box-shadow: 0 6px 16px rgba(26,157,144,0.3);
        margin: 6px 0; transition: transform .12s ease, border-bottom-width .12s ease;
      }
      .vg-secondary-btn:hover { transform: translateY(-2px); }
      .vg-secondary-btn:active { transform: translateY(4px); border-bottom-width: 2px; }

      .vg-ghost-btn {
        width: 100%; max-width: 320px; padding: 11px; margin-top: 4px;
        color: var(--ink-soft); font-weight: 700; font-size: 14px; text-decoration: underline;
        text-underline-offset: 4px; transition: color .2s ease;
      }
      .vg-ghost-btn:hover { color: var(--ink); }

      /* ---------- home screen ---------- */
      .vg-home {
        position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
        align-items: center; justify-content: center; padding: 32px 20px 96px; text-align: center;
      }
      .vg-home-sound { position: absolute; top: 20px; right: 20px; }
      .vg-logo { position: relative; margin-bottom: 14px; }
      .vg-logo-mark { position: relative; filter: drop-shadow(0 6px 10px rgba(120,70,10,0.35)); animation: vg-badge-bob 3s ease-in-out infinite; }
      @keyframes vg-badge-bob { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-6px) rotate(2deg); } }

      .vg-title {
        font-size: clamp(30px, 8vw, 42px); font-weight: 800; margin: 4px 0 6px; letter-spacing: -0.5px;
        color: #fff; -webkit-text-stroke: 2px #2a6fa8; text-stroke: 2px #2a6fa8;
        text-shadow: 0 4px 0 #2a6fa8, 0 6px 12px rgba(15,60,90,0.25);
      }
      .vg-title-accent { color: var(--yellow); -webkit-text-stroke: 2px #a85a12; text-stroke: 2px #a85a12; text-shadow: 0 4px 0 #a85a12, 0 6px 12px rgba(90,50,10,0.25); }
      .vg-subtitle { color: #1f5f8a; font-weight: 700; font-size: 15px; margin-bottom: 22px; max-width: 320px; }

      .vg-home-best {
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        padding: 12px 30px; border-radius: 20px; background: var(--panel);
        border: 2px solid var(--panel-border); border-bottom: 5px solid var(--panel-border);
        box-shadow: 0 6px 14px rgba(40,60,20,0.12); margin-bottom: 22px;
      }
      .vg-home-best-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-soft); font-weight: 800; }
      .vg-home-best-value { font-size: 26px; font-family: 'Baloo 2', sans-serif; font-weight: 800; color: var(--yellow-shadow); }

      .vg-diff-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #1f5f8a; font-weight: 800; margin-bottom: 8px; }
      .vg-diff-row { display: flex; gap: 10px; margin-bottom: 8px; }
      .vg-diff-btn {
        padding: 10px 18px; border-radius: 14px; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 14px;
        background: var(--panel); color: var(--ink-soft);
        border: 2px solid var(--panel-border); border-bottom: 4px solid var(--panel-border);
        transition: transform .12s ease, border-bottom-width .12s ease, background .15s ease, color .15s ease;
      }
      .vg-diff-btn:hover { transform: translateY(-2px); }
      .vg-diff-btn:active { transform: translateY(2px); border-bottom-width: 2px; }
      .vg-diff-btn-active {
        background: var(--diff-color); border-color: var(--diff-shadow); border-bottom-color: var(--diff-shadow);
        color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,0.15);
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      }
      .vg-diff-hint { font-size: 12px; font-weight: 700; color: #1f5f8a; margin-bottom: 18px; min-height: 16px; }

      .vg-home-categories { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 24px; max-width: 360px; }
      .vg-chip {
        font-size: 12px; font-weight: 800; padding: 6px 13px; border-radius: 100px; background: var(--panel);
        border: 2px solid var(--panel-border); color: var(--purple-shadow);
      }

      /* ---------- top bar ---------- */
      .vg-topbar {
        position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between;
        gap: 8px; padding: 12px 14px; margin: 12px; border-radius: 20px;
        background: transparent; border: none;
      }
      .vg-topbar-left, .vg-topbar-right { display: flex; align-items: center; gap: 8px; }
      .vg-hearts { display: flex; gap: 6px; }
      .vg-heart { transition: transform .2s ease; }
      .vg-heart-dead { opacity: 0.35; }
      .vg-heart-pulse { animation: vg-heart-lost .6s ease; }
      @keyframes vg-heart-lost { 0% { transform: scale(1);} 30% { transform: scale(1.4); } 60% { transform: scale(0.8) rotate(-10deg); } 100% { transform: scale(1); } }
      .vg-score { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 19px; min-width: 44px; text-align: right; color: var(--ink); }
      .vg-combo {
        font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 100px; white-space: nowrap;
        background: var(--yellow); border: 2px solid var(--yellow-shadow); color: #6b4400;
        animation: vg-combo-pop .3s ease;
      }
      @keyframes vg-combo-pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      /* ---------- game wrap / center ---------- */
      .vg-game-wrap { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
      .vg-center {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 16px; padding: 8px 16px 20px; transition: opacity .25s ease, transform .25s ease;
      }
      .vg-category-tag {
        font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #fff;
        font-weight: 800; padding: 6px 16px; border-radius: 100px; background: var(--purple);
        border: 2px solid var(--purple-shadow); box-shadow: 0 4px 10px rgba(127,63,224,0.3);
      }

      .vg-def-card {
        width: 100%; max-width: 420px; min-height: 110px; display: flex; align-items: center; justify-content: center;
        padding: 24px 26px; border-radius: 24px; background: var(--panel);
        border: 2px solid var(--panel-border); border-bottom: 6px solid var(--panel-border);
        box-shadow: 0 12px 26px rgba(30,60,90,0.18);
        text-align: center;
      }
      .vg-def-text { font-size: clamp(15px, 3.6vw, 19px); line-height: 1.5; font-weight: 700; color: var(--ink); }

      .vg-slots { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 420px; }
      .vg-slot {
        width: 42px; height: 50px; border-radius: 12px; background: var(--cream);
        border: 2px solid var(--panel-border); border-bottom: 4px solid var(--panel-border);
        font-family: 'Baloo 2', sans-serif; font-size: 20px; font-weight: 800; color: var(--ink);
        display: flex; align-items: center; justify-content: center; text-transform: uppercase;
        animation: vg-slot-in .35s ease both; transition: border-color .2s ease, background .2s ease, transform .15s ease;
      }
      @keyframes vg-slot-in { from { opacity: 0; transform: translateY(8px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .vg-slot-filled { background: #fff; border-color: var(--purple); transform: scale(1.03); }
      .vg-slot-filled:active { transform: scale(0.95); }
      .vg-slot-correct { background: #7ed957; border-color: #3f9425; color: #16410a; animation: vg-slot-correct .5s ease; }
      @keyframes vg-slot-correct { 0% { transform: scale(1); } 40% { transform: scale(1.18) rotate(-4deg); } 100% { transform: scale(1); } }
      .vg-slot-wrong { background: var(--red); border-color: var(--red-shadow); color: #fff; }

      .vg-shake { animation: vg-shake .5s cubic-bezier(.36,.07,.19,.97); }
      @keyframes vg-shake {
        10%,90% { transform: translateX(-2px); } 20%,80% { transform: translateX(4px); }
        30%,50%,70% { transform: translateX(-8px); } 40%,60% { transform: translateX(8px); }
      }

      .vg-tools { display: flex; gap: 10px; }
      .vg-tool-btn {
        display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800;
        padding: 8px 16px; border-radius: 100px; background: var(--panel);
        border: 2px solid var(--panel-border); border-bottom: 4px solid var(--panel-border);
        color: var(--purple-shadow); transition: transform .1s ease, border-bottom-width .1s ease;
      }
      .vg-tool-btn:hover { transform: translateY(-1px); }
      .vg-tool-btn:active { transform: translateY(3px); border-bottom-width: 2px; }
      .vg-tool-btn.vg-btn-disabled { opacity: 0.4; pointer-events: none; }

      .vg-keyboard {
        display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; max-width: 460px; margin-top: 4px;
      }
      .vg-key {
        width: 44px; height: 48px; border-radius: 14px; font-family: 'Baloo 2', sans-serif; font-size: 18px; font-weight: 700;
        background: #fff; border: 2px solid var(--panel-border); border-bottom: 4px solid #d8c9a3;
        color: var(--ink);
        box-shadow: 0 6px 12px rgba(30,60,90,0.12);
        transition: transform .1s ease, border-bottom-width .1s ease, opacity .2s ease, background .15s ease;
      }
      .vg-key:nth-child(5n+1) { background: #fff4e0; }
      .vg-key:nth-child(5n+2) { background: #eefaf3; }
      .vg-key:nth-child(5n+3) { background: #f2edff; }
      .vg-key:nth-child(5n+4) { background: #fff0f0; }
      .vg-key:hover { transform: translateY(-3px); }
      .vg-key:active { transform: translateY(3px); border-bottom-width: 1px; }
      .vg-key-used { opacity: 0; pointer-events: none; transform: scale(0.5); }

      /* ---------- bottom bar ---------- */
      .vg-bottombar { position: relative; z-index: 3; padding: 10px 20px 26px; }
      .vg-level-label { font-family: 'Baloo 2', sans-serif; font-size: 13px; font-weight: 800; color: #1f5f8a; margin-bottom: 6px; text-align: center; letter-spacing: 1px; text-transform: uppercase; }
      .vg-progress-track { width: 100%; max-width: 460px; margin: 0 auto; height: 12px; border-radius: 100px; background: rgba(255,255,255,0.6); overflow: hidden; border: 2px solid var(--panel-border); }
      .vg-progress-fill { height: 100%; border-radius: 100px; background: var(--yellow); transition: width .5s cubic-bezier(.22,1,.36,1); box-shadow: inset 0 -3px 0 var(--yellow-shadow); }

      /* ---------- overlays ---------- */
      .vg-overlay {
        position: absolute; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center;
        background: rgba(20,60,90,0.45); padding: 20px;
      }
      .vg-overlay-solid {
        position: relative; z-index: 2; flex: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
      }
      .vg-panel {
        width: 100%; max-width: 380px; padding: 32px 26px; border-radius: 28px; text-align: center;
        background: var(--panel); border: 2px solid var(--panel-border); border-bottom: 8px solid var(--panel-border);
        box-shadow: 0 20px 50px rgba(20,60,90,0.28);
        display: flex; flex-direction: column; align-items: center;
      }
      .vg-panel-title { font-family: 'Baloo 2', sans-serif; font-size: 25px; font-weight: 800; margin-bottom: 6px; color: var(--ink); }
      .vg-panel-sub { color: var(--ink-soft); font-weight: 700; font-size: 14px; margin-bottom: 18px; }
      .vg-trophy { margin-bottom: 8px; filter: drop-shadow(0 6px 10px rgba(255,157,31,0.4)); animation: vg-badge-bob 2.4s ease-in-out infinite; }
      .vg-gameover-icon { margin-bottom: 6px; }
      .vg-newbest { color: var(--yellow-shadow); font-weight: 800; margin-bottom: 14px; animation: vg-combo-pop .4s ease; }

      .vg-stat-row { display: flex; gap: 10px; width: 100%; margin: 12px 0 18px; }
      .vg-stat-block { flex: 1; padding: 14px 8px; border-radius: 16px; background: var(--cream); border: 2px solid var(--panel-border); display: flex; flex-direction: column; gap: 2px; }
      .vg-stat-value { font-family: 'Baloo 2', sans-serif; font-size: 20px; font-weight: 800; color: var(--purple-shadow); }
      .vg-stat-label { font-size: 10px; color: var(--ink-soft); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

      .vg-xp-track { width: 100%; height: 10px; border-radius: 100px; background: var(--cream); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--panel-border); }
      .vg-xp-fill { height: 100%; background: var(--purple); transition: width .6s ease; box-shadow: inset 0 -3px 0 var(--purple-shadow); }

      .vg-stats-list { width: 100%; display: flex; flex-direction: column; gap: 10px; margin: 14px 0 22px; }
      .vg-stats-row { display: flex; justify-content: space-between; padding: 12px 16px; border-radius: 14px; background: var(--cream); border: 2px solid var(--panel-border); font-weight: 700; font-size: 14px; }
      .vg-stats-row strong { color: var(--purple-shadow); }

      /* ---------- responsive ---------- */
      @media (max-width: 420px) {
        .vg-slot { width: 34px; height: 42px; font-size: 17px; }
        .vg-key { width: 38px; height: 42px; font-size: 16px; }
        .vg-def-card { padding: 20px 18px; border-radius: 20px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .vg-root *, .vg-root *::before, .vg-root *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}