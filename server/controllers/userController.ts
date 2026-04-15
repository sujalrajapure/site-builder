import {Request, Response} from 'express'
import prisma from '../lib/prisma.js';
import Stripe from 'stripe'

// Get User Credits
export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: {id: userId}
        })

        res.json({credits: user?.credits})
    } catch (error : any) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
}

// Controller Function to create New Project
export const createUserProject = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;

        if(!userId){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: {id: userId}
        })

        if(user && user.credits < 5){
            return res.status(403).json({ message: 'add credits to create more projects' });
        }

        // Create a new project record immediately
        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId
            }
        })

        await prisma.user.update({
            where: {id: userId},
            data: {totalCreation: {increment: 1}}
        })

        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id
            }
        })

        await prisma.user.update({
            where: {id: userId},
            data: {credits: {decrement: 5}}
        })

        // Return project ID immediately – client navigates and uses SSE for live updates
        res.json({projectId: project.id})

        // Fire-and-forget: generate components one-by-one in background
        ;(async () => {
            try {
                const { generateModularProject } = await import('./generationController.js');
                await generateModularProject(project.id, initial_prompt);
                await prisma.conversation.create({
                    data: { role: 'assistant', content: '✅ Your website is ready! You can now preview and edit it.', projectId: project.id }
                });
            } catch (e: any) {
                console.error('Background generation error:', e);
                await prisma.conversation.create({
                    data: { role: 'assistant', content: 'Generation encountered an error. Please use the revision feature to retry.', projectId: project.id }
                });
                await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 5 } } });
            }
        })();

    } catch (error : any) {
        if (userId) {
            await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 5}}
            }).catch(() => {});
        }
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

// SSE endpoint: streams real-time component-by-component generation progress to the client
export const streamProjectGeneration = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await prisma.websiteProject.findUnique({
        where: { id: projectId, userId }
    });

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (data: object) => {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            if ((res as any).flush) (res as any).flush();
        } catch (_) {}
    };

    // If project already has complete code, send done immediately
    if (project.current_code) {
        send({ event: 'done', code: project.current_code });
        res.end();
        return;
    }

    send({ event: 'start', total: 7, message: 'Building your website component by component...' });

    try {
        const { streamGeneration } = await import('./generationController.js');
        await streamGeneration(projectId, project.initial_prompt, res);
    } catch (err: any) {
        send({ event: 'error', message: err.message });
        res.end();
    }
}

// Controller Function to Get A Single User Project
export const getUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {projectId} = req.params;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID format' });
        }

        console.log(`Fetching project ${projectId} for user ${userId}`);

       const project = await prisma.websiteProject.findUnique({
        where: {id: projectId, userId},
        include: {
            conversation: {
                orderBy: {timestamp: 'asc'}
            },
            versions: {orderBy: {timestamp: 'asc'}}
        }
       })

        if (!project) {
            console.log(`Project ${projectId} not found for user ${userId}`);
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({project})

    } catch (error : any) {
        console.error('getUserProject error:', error.code || error.message, { projectId: req.params.projectId, userId: req.userId });
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Controller Function to Get All Users Projects
export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized' });
        }

       const projects = await prisma.websiteProject.findMany({
        where: {userId},
        orderBy: {updatedAt: 'desc'}
       })

        res.json({projects})

    } catch (error : any) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
}

// Controller Function to Toggle Project Publish
export const togglePublish = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {projectId} = req.params;

        const project = await prisma.websiteProject.findUnique({
            where: {id: projectId, userId}
        })

        if(!project){
            return res.status(404).json({ message: 'Project not found' });
        }

        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {isPublished: !project.isPublished}
        })
       
        res.json({message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully'})

    } catch (error : any) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
}

// Controller Function to Purchase Credits
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        interface Plan {
            credits: number;
            amount: number;
        }

        const plans = {
            basic: {credits: 100, amount: 5},
            pro: {credits: 400, amount: 19},
            enterprise: {credits: 1000, amount: 49},
        }

        const userId = req.userId;
        const {planId} = req.body as {planId: keyof typeof plans}
        const origin = req.headers.origin as string;

        const plan: Plan = plans[planId]

        if(!plan){
            return res.status(404).json({ message: 'Plan not found' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: userId!,
                planId: req.body.planId,
                amount: plan.amount,
                credits: plan.credits
            }
        })

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

        const session = await stripe.checkout.sessions.create({
                success_url: `${origin}/loading`,
                cancel_url: `${origin}`,
                line_items: [
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `AiSiteBuilder - ${plan.credits} credits`
                        },
                        unit_amount: Math.floor(transaction.amount) * 100
                    },
                    quantity: 1
                    },
                ],
                mode: 'payment',
                metadata: {
                    transactionId: transaction.id,
                    appId: 'ai-site-builder'
                },
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
                });

        res.json({payment_link: session.url})

    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
}