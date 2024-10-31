import { raw } from 'hono/html'

export const ChatForm = () => {
	return (
		<>
			<form
				action="/"
				method="post"
				class="flex w-full items-center rounded-b-md border-t border-slate-300 bg-slate-200 p-2 dark:border-slate-700 dark:bg-slate-900 m-0"
				id="chat-form"
			>
				<label htmlFor="chat" class="sr-only">
					Enter your prompt
				</label>

				<textarea
					id="chat-input"
					rows={15}
					name="message"
					class="mx-2 flex min-h-full w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
					placeholder="Enter your prompt"
					required
				/>
				<div>
					<button
						class="inline-flex hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-600 sm:p-2"
						type="submit"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							aria-hidden="true"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M10 14l11 -11" />
							<path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
						</svg>
						<span class="sr-only">Send message</span>
					</button>
				</div>
			</form>

			<script>
				{raw(`
        document.addEventListener("DOMContentLoaded", function() {

          const textarea = document.getElementById("chat-input");
          const form = document.getElementById("chat-form");

          function handleSSE(ev) {
            const elementIdMap = {
              'final-message': 'final-message',
              'description': 'content',
              'fact': 'facts',
              'checklist': 'checklist'
            };

            const targetElementId = elementIdMap[ev.event.replace('end-','')];
            if (targetElementId) {
              const el = document.getElementById(targetElementId)
              
              try{
                if(ev.event.startsWith('end-')){
                  el.innerHTML = ev.data.data;
                  return
                }
                const c = ev.data.data.replaceAll('\\n', '<br/>')
                if(ev.id==='0') {
                  el.innerHTML = c;
                }else{
                  el.innerHTML += c;
                }
              }catch(e){console.error(e,ev)}
            } else {
              console.error('Unknown event type', ev);
            };
          };

          async function sendData() {
            // Associate the FormData object with the form element

            try {
              const response = await fetch("/", {
                method: "POST",
                // Set the FormData instance as the request body
                body: textarea.value,
                headers: {
                  'Content-Type': 'text/event-stream'
                },
              });

              textarea.value = '';

              const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                if (!value.trim()) continue;

                const lines = value.trim().split('\\n');

                let eventObject = { data: '', id: null, event: 'message' }; 

                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    eventObject.data += line.replace(/^data:\s*/, '');
                  } else if (line.startsWith('id:')) {
                    eventObject.id = line.replace(/^id:\s*/, '').trim();
                  } else if (line.startsWith('event:')) {
                    eventObject.event = line.replace(/^event:\s*/, '').trim();
                    eventObject.data= '';
                  }
                };

                try {
                  eventObject.data = eventObject.data==="" ? {data:""} : JSON.parse(eventObject.data);
                }catch(err){
                console.error("Error parsing JSON", eventObject.data)
                   //eventObject.data = eventObject.data
                }
                
                handleSSE(eventObject);
              };

            } catch (e) {
              console.error(e);
            }
          }

          // Take over form submission
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            sendData();
          });

         

          if (textarea) {
            textarea.addEventListener("keydown", function(event) {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                form.requestSubmit();
              }
            });
          }
        });
      `)}
			</script>
		</>
	)
}
