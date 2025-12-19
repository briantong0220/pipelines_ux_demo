npm run dev

Design: 
- Modularized creation of tasks. 
A node outputs a task object that was given as input, but with its own fields appended. Hence each node can be thought of as function that maps from task -> task. The start node initializes an   empty "task" object, and by traversing the directed graph, the task object gets filled with subtask and review fields. Cycles in the graph are handled such that if an edge leads to a node's   own parent or ancestor (such as a review being rejected, and the edge leading back to the same task), the fields are detected via ID so that the fields do not get appended again as duplicates. Hence the underlying graph (for creating a task) is essentially a DAG. If there is a cycle that emerges outside from rejected reviews, then the graph will be detected to be incorrect (since that pipeline will not terminate).
- Central canvas for both pipeline and subtask creation
Rather than giving the users seperate UX endpoints for pipeline and subtask creation, the design is such that both are in one central canvas. An expandable "edit task/review" tab is given to each node in the graph, eliminating the need to navigate away from the pipeline editor.
- Assignment and routing
There is a central task queue in the db. Editors and reviewers poll this db, and their client will create a queue of tasks to complete. Routing is managed automatically based on permissions, such as when the reviewer and editor must be different, or if a review rejected task must be completed by the same editor again.
- Pipeline templates
The underlying graph is represented as a collection of nodes, edges, and their coordinates. Hence any template graph can be implemented just by providing these configurations. An example template is given as an option when creating new pipelines, where users can provide the number of task/review cycles, and a skeleton graph is created automatically. 

Future work
- More input fields, based on use case
Currently, the demo supports inputs of long text, short text, file upload, and dynamic custom fields. We might want to think of what other use cases are for inputs.
- Types of nodes
Currently, the demo has start/end nodes, subtask nodes, and review nodes. It is entirely possible to customize this with additional types of nodes, such as collector nodes that collect multiple inputs to produce one output, or if-statement nodes that branch based on given conditions. Again, this is up to use-case, so feel free to suggest any type of node, and I can implement them in code.
- Suggestions
Any feedback provided will be used to improve the UX demo before we finalize on a complete feature-set

  



