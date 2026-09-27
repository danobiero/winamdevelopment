import {getBookedDatesByLessonId, getLesson} from "@/app/_lib/data-service"

export async function GET(request, {params}){
    const {lessonId} = params

    try {
    const [lesson, bookedDates] = await Promise.all([getLesson(lessonId), getBookedDatesByLessonId(lessonId)])
return Response.json({lesson, bookedDates})    
} catch (error) {
        return Response.json("Lesson not found")
    }
    
}