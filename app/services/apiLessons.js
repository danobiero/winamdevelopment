import supabase from "../_lib/supabase";

export async function getLessons(){

    
const {data, error } = await supabase.from('lessons').select('*');

if (error){
    console.error(error)
    throw new Error('Lessons could not be loaded');
}

return data
}